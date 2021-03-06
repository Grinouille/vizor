function UndoManager() {
	this.undoStack = []
	this.redoStack = []
}

UndoManager.prototype.isUndoable = function() {
	return this.undoStack.length > 0
}

UndoManager.prototype.isRedoable = function() {
	return this.redoStack.length > 0
}

UndoManager.prototype.getUndoStack = function() {
	return this.undoStack
}

UndoManager.prototype.getRedoStack = function() {
	return this.redoStack
}

UndoManager.prototype.begin = function(title) {
	if (this._transaction) // xa already in progress, nop
		return;

	var xa = {
		title: title,
		undoStack: []
	}

	xa.redo = function() {
		xa.undoStack.reverse().map(function(xi) {
			xi.redo()
		})
	}

	xa.undo = function() {
		xa.undoStack.reverse().map(function(xi) {
			xi.undo()
		})
	}

	this._transaction = xa
}

UndoManager.prototype.end = function() {
	var xa = this._transaction

	if (!xa)
		return;

	this._transaction = null

	this.push(xa)
}

UndoManager.prototype.execute = function(item) {
	this.push(item)
	return item.redo()
}

UndoManager.prototype.undo = function() {
	var item = this.undoStack.pop()

	if (!item)
		return;

	this.redoStack.push(item)

	return item.undo()
}

UndoManager.prototype.redo = function() {
	var item = this.redoStack.pop()

	if (!item)
		return;

	this.undoStack.push(item)

	return item.redo()
}

UndoManager.prototype.push = function(item) {
	if (this._transaction)
		return this._transaction.undoStack.push(item)

	this.undoStack.push(item)
	this.redoStack = []
}

if (typeof(module) !== 'undefined')
	module.exports = UndoManager

