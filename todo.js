'use strict';

var botName = 'todo';
var botMessageText = `Would anyone like to do '%s'? Type @${botName} %d.`;
var actionConfidence = .8;	// i.e. 80% confident it's an action
var todoId = 0;
var todos = new Map();

module.exports.handleMessage = function(body, callback) {
  var command = body.content.substring(botName.length+2);

  // if the command is just a number, someone is accepting a todo
  if(/^\d+$/.test(command)) {

    // parseInt because the set uses the todoId
    var todo = todos.get(parseInt(command));

    if(todo) {
      var userTodos = todos.get(body.userId);

      if(userTodos) {
          userTodos.push(todo);
      } else {
        userTodos = [todo];
      }

      console.log(`${body.userName} ${body.userId} has accepted todo ${todo}`);

      todos.set(body.userId, userTodos);

      callback(null, `Thanks, ${body.userName}. I'll add a todo to your list.`);
    } else {
      // * is markdown
      callback(null, `Hmm. I can't seem to find todo #${command}. I'll add that to *my* todo list.`);
    }
  } else {
    // do other commands - for example listing todos
    console.log(`${body.userName} sent me '${body.content}'`);

    var userTodos = todos.get(body.userId);
    if(userTodos) {
      var msg = '';
      for(var i in userTodos) {
        // 1. some todo text
        msg+= `${userTodos[i]} #todo${i}`;

        if((i + 1) < userTodos.length) {
          msg+= '; ';
        }
      }
      callback(null, `Hi, ${body.userName}. You have these todos: ${msg}`);
    } else {
      callback(null, `Hi, ${body.userName}. You don't have anything to do. Lucky you.`);
    }
  }
}

module.exports.handleActionRequest = function(body, callback) {
  var payload = JSON.parse(body.annotationPayload);

  // need to ignore messages from the bot like replies to the user
  if(payload.phrase.indexOf(`${botName}`) == -1) {
    console.log(`New message ${body.messageId} being processed`);

    if(payload.confidence >= actionConfidence) {
      var message = botMessageText.replace('%s', payload.phrase).replace('%d', todoId);

      // store the phrase (i.e. the todo) with an internal ID
      // this ID later used to associate user with a specific todo
      todos.set(todoId, payload.phrase);
      todoId++;	// increment the todo counter

      callback(null, message);

    } else {
      console.log(`Skipping ${body.messageId}; confidence was below ${actionConfidence}`);
    }
  } else {
    console.log(`Already processed todo for message ${body.messageId}`);
  }
}
