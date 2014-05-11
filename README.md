# What this is
TaskFlow (codename) is a simple task list manager for humans. It can be used to enter positions to be later displayed on the list, mark them as done, and leave comments/notes for self for later reference.

# Development stage
Pre-alpha. This was never intended as a serious project - actually, the main goal has been to fit the development of the main code (i.e. make it work) into under an hour to prove that building an ESDF-based tech demo for an application can be short and painless.

**Note that there is no persistence support at this point - when you quit the program, all entries are lost.** This can be amended rather easily by exchanging the used EventSink (and Streamer) for a DB-backed one, such as esdf-store-redis.

# How to use it
## Installation
First, install the dependencies. You need ESDF and the in-memory store to be able to use it:
https://github.com/rkaw92/esdf
https://github.com/rkaw92/esdf-reporting-memory

Place the cloned repositories into TaskFlow's node_modules (creating the directory if necessary).

## Running
To run the software:

```
node server.js
```

## Interaction API

After executing the command, the user will be presented with a Node.js read-eval-print loop (REPL). From there, JavaScript statements may be executed.
All functions which modify application state (write, not read-only operations; currently addTask, done, comment, postpone) return a promise (thenable) which fulfills once the operation is carried out and reject on error.
The following functions of the program are available in the REPL context (so that you can simply type the function name to call it):

### tasks

**tasks([all])**
Return a list of pending tasks, sorted by their due date/time. If the optional "all" parameter is set to true, all tasks are returned (in the same order), even if marked as done.

### allTasks
**allTasks()**
Alias of **tasks(true)**.

### addTask
**addTask(title, inHours)**
Add a task with the given title and mark it as due in **inHours** hours. Hours can be expressed by fractional numbers as well, so adding a task due in 0.5 hours (30 minutes) is a valid operation.

### done
**done(pattern)**
Mark a task as done. The pattern can be a part of the ID or part of the title. For instance, it is possible to do the following:
```
addTask('call John', 0.5);
done('call J');
// Or, alternatively:
done('John');
```
If multiple tasks match the pattern, the program will return an error stating that the user's choice is ambigious and a more precise pattern should be provided. The error object shall contain a list of candidates that matched.

### comment
**comment(pattern, comment)**
Add a comment to a task entry. Comments are visible when listing tasks and can be used as short notes to self, helping the user accomplish the task at hand.
The task to which the comment is added is determined based on the passed pattern, similar to how **done** works.

### postpone
**postpone(pattern, byHours [, comment])**
Put off a task for later by the indicated amount of hours. Task selection is done based on the pattern, just like in all other select-and-modify operations.
A string comment can also be provided as the postponement reason.