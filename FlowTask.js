var esdf = require('esdf');
var util = require('util');

// ### Constructor ###

function FlowTask(){
	this._submitted = false;
	this._title = null;
	this._content = null;
	this._done = false;
	this._plannedDate = null;
}
util.inherits(FlowTask, esdf.core.EventSourcedAggregate);
FlowTask.prototype._aggregateType = 'FlowTask';

// ### Event handlers ###

FlowTask.prototype.onTaskSubmitted = function onTaskSubmitted(event){
	this._submitted = true;
	this._title = event.eventPayload.title;
	this._plannedDate = new Date(event.eventPayload.plannedDate);
};

FlowTask.prototype.onTaskPostponed = function onTaskPostponed(event){
	this._plannedDate = new Date(event.eventPayload.plannedDate);
};

FlowTask.prototype.onTaskCommentAdded = function onTaskCommentAdded(event){
	// We don't even have to do anything! Isn't this great?
};

FlowTask.prototype.onTaskMarkedAsDone = function onTaskMarkedAsDone(event){
	this._done = true;
};

// ### Aggregate methods ###

FlowTask.prototype.getPlannedDate = function getPlannedDate(){
	return new Date(this._plannedDate);
};

FlowTask.prototype.submit = function submit(title, date, plannedDate){
	this._stageEvent(new esdf.core.Event('TaskSubmitted', {
		title: String(title),
		date: new Date(date),
		plannedDate: new Date(plannedDate)
	}));
};

FlowTask.prototype.postpone = function postpone(comment, date, plannedDate){
	this._stageEvent(new esdf.core.Event('TaskPostponed', {
		comment: String(comment),
		date: new Date(date),
		plannedDate: new Date(plannedDate)
	}));
};

FlowTask.prototype.addComment = function addComment(comment, date){
	this._stageEvent(new esdf.core.Event('TaskCommentAdded', {
		comment: String(comment),
		date: new Date(date)
	}));
};

FlowTask.prototype.markAsDone = function markAsDone(date){
	if(this._done){
		return;
	}
	this._stageEvent(new esdf.core.Event('TaskMarkedAsDone', {
		date: new Date(date)
	}));
};


module.exports.FlowTask = FlowTask;