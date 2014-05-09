var esdf = require('esdf');
var MemoryRS = require('esdf-reporting-memory');
//var express = require('express');
//var io = require('socket.io');
var util = require('util');
var repl = require('repl');
var uuid = require('uuid');

var view = new MemoryRS.MemoryReportingStore();
var sink = new esdf.test.DummyEventSink();
var streamer = new esdf.test.DummyEventSinkStreamer(sink);
var publisher = new esdf.test.DummyEventBusPublisher();
var subscriber = new esdf.test.DummyEventBusSubscriber(publisher);
var loader = esdf.utils.createAggregateLoader(sink);
var repository = new esdf.utils.Repository(loader);

subscriber.queue('Tasks').bind('FlowTask.*').listen(function(eventCommitTuple){
	var event = eventCommitTuple.event;
	var commit = eventCommitTuple.commit;
	var taskID = commit.sequenceID;
	var payload = event.eventPayload;
	view.transformRecord(taskID, function(currentView){
		switch(event.eventType){
			case 'TaskSubmitted':
				currentView = {
					title: payload.title,
					submitted: new Date(payload.date),
					lastModified: new Date(payload.date),
					plannedDate: new Date(payload.plannedDate),
					comments: [],
					done: false
				};
				break;
			case 'TaskPostponed':
				currentView.plannedDate = new Date(payload.plannedDate);
				currentView.lastModified = new Date(payload.date);
				break;
			case 'TaskCommentAdded':
				currentView.comments.push({
					date: new Date(payload.date),
					comment: payload.comment
				});
				break;
			case 'TaskMarkedAsDone':
				currentView.done = true;
				break;
		}
		return currentView;
	});
});
streamer.setPublisher(publisher);
streamer.start();


function _projection(record, id){
	return {
		id: id,
		title: record.title,
		planned: record.plannedDate.toLocaleString(),
		comments: record.comments.map(function _trimCommentDisplay(comment){
			return comment.comment
		}),
		done: record.done
	};
}

var FlowTask = require('./FlowTask').FlowTask;
function _findAndInvoke(which, operation){
	which = which || '';
	function escapeRegExp(string){
		return string.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
	}
	var searchRegex = util.isRegExp(which) ? which : new RegExp('.*' + escapeRegExp(which) + '.*', 'i');
	var searchResults = view.findRecords(function _condition(record, id){
		return (!record.done) && (searchRegex.test(id) || searchRegex.test(record.title));
	}, _projection);
	if(searchResults.length === 1){
		return repository.invoke(FlowTask, searchResults[0].id, operation);
	}
	else{
		if(searchResults.length > 0){
			return {
				error: 'Multiple tasks match the search pattern. Please choose a more precise one.',
				choices: searchResults
			};
		}
		else{
			return {
				error: 'No tasks matching the pattern found.'
			};
		}
	}
}


var shell = repl.start({
	prompt: 'TaskFlow ~ '
});

shell.context.repository = repository;
shell.context.FlowTask = FlowTask;
shell.context.tasks = function tasks(all){
	return view.findRecords(function _condition(record){
		return (all ? true : !record.done);
	}, _projection, function _sorting(taskA, taskB){
		return (new Date(taskA.planned)).getTime() > (new Date(taskB.planned)).getTime();
	});
};
shell.context.allTasks = shell.context.tasks.bind(undefined, true);
shell.context.addTask = function addTask(title, inHours){
	var taskID = uuid.v4();
	repository.invoke(FlowTask, taskID, function(task){
		task.submit(title, new Date(), new Date((new Date()).getTime() + 3600000 * inHours));
	}).then(undefined, console.error);
};
shell.context.done = function done(which){
	return _findAndInvoke(which, function _done(task){
		task.markAsDone(new Date());
	});
};
shell.context.comment = function comment(which, comment){
	return _findAndInvoke(which, function _comment(task){
		task.addComment(comment, new Date());
	});
};
shell.context.postpone = function postpone(which, byHours, comment){
	return _findAndInvoke(which, function _postpone(task){
		task.postpone(comment, new Date(), new Date(task.getPlannedDate().getTime() + 3600000 * byHours));
	});
};