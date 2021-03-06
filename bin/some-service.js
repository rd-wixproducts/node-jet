#!/usr/bin/env node

var jet = require('../lib/jet');

var peer = new jet.Peer();

peer.state({
	path: 'acceptAll',
	value: 123,
	set: function (val) {
		console.log('acceptAll is now', val);
	}
});

peer.state({
	path: 'acceptAllButSlow',
	value: 123,
	set: function (val, reply) {
		var timeout = 1;
		if (typeof (val) === 'object' && typeof (val.timeout) === 'number') {
			timeout = val.timeout;
		}
		setTimeout(function () {
			console.log('acceptAllButSlow is now', val);
			reply();
		}, timeout * 1000);
	}
});

peer.state({
	path: 'acceptOnlyNumbers',
	value: 4112,
	set: function (val) {
		if (typeof (val) !== 'number') {
			throw new Error('only numbers supported');
		}
	}
});


peer.method({
	path: 'syncHello',
	call: function (who) {
		return 'Hello ' + who;
	}
});

peer.method({
	path: 'asyncHello',
	callAsync: function (reply, who) {
		setTimeout(function () {
			reply({
				result: 'Hello ' + who
			});
		}, 1000);
	}
});

peer.method({
	path: 'letsFailAsync',
	callAsync: function (reply) {
		setTimeout(function () {
			reply({
				error: 'I always fail'
			});
		}, 1000);
	}
});

peer.method({
	path: 'letsFailSync',
	call: function () {
		throw 'I always fail';
	}
});

// generates a function which assigns the value passed in to
// the variable target
var assign = function (target) {
	return function (val) {
		target = val;
	};
};

var persons = [];

var firstNames = ['Paul', 'Ben', 'George', 'Steve', 'Bill', 'Bert', 'Jimmy', 'Hank', 'Jessy'];
var lastNames = ['Schroeder', 'Irish', 'Foreman', 'Mandy', 'Jops', 'Black', 'White', 'Lee'];
var randomEntry = function (array) {
	var index = Math.random() * array.length;
	index = Math.floor(index);
	return array[index];
};

for (var i = 0; i < 100; ++i) {
	persons.push({
		age: Math.floor(Math.random() * 100),
		firstName: randomEntry(firstNames),
		lastName: randomEntry(lastNames),
		score: Math.floor(Math.random() * 100000)
	});
}


persons.forEach(function (person, index) {
	peer.state({
		path: 'persons/' + index,
		value: person,
		set: assign(person)
	});
});

var todos = {};
var tid = 0;

peer.method({
	path: 'todo/add',
	call: function (todo) {
		var todoId = ++tid;
		var todo = peer.state({
			path: 'todo/#' + todoId,
			value: {
				completed: todo.completed,
				title: todo.title,
				id: todoId
			},
			set: function (todo) {
				return {
					value: {
						completed: todo.completed,
						title: todo.title,
						id: todo.id
					}
				};
			}
		});

		todos[todoId] = todo;
	}
});

peer.method({
	path: 'todo/remove',
	call: function () {
		var args = Array.prototype.slice.call(arguments);
		args.forEach(function (todo) {
			todos[todo.id].remove();
		});
	}
});