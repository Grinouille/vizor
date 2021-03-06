var assert = require('assert');

var helpers = require('./helpers')
var reset = helpers.reset
var connect = helpers.connect
var disconnect = helpers.disconnect

var reset = require('./helpers').reset;

describe('Changing Slot Values', function() {
	var graph, orNode, floatDisplay

	beforeEach(function() {
		reset()

		graph = E2.core.active_graph
		orNode = E2.app.instantiatePlugin('or_modulator')
		floatDisplay = E2.app.instantiatePlugin('bool_display')

		connect(graph, orNode, 0, floatDisplay, 0, false)

		E2.app.graphApi
			.changeInputSlotValue(graph, orNode, 'a', true)
	})

	it('sets values on dispatch', function() {
		assert.equal(true, orNode.plugin.conds[0])
		graph.update()
		assert.equal(true, floatDisplay.plugin.inputValues['bool'])
	})

	it('can undo to previous value', function() {
		E2.app.graphApi
			.changeInputSlotValue(graph, orNode, 'a', false)

		assert.equal(false, orNode.plugin.conds[0])

		E2.app.undoManager.undo()

		assert.equal(true, orNode.plugin.conds[0])
		graph.update()
		assert.equal(true, floatDisplay.plugin.inputValues['bool'])
	})

	it('can serialize slot values', function() {
		var ser = E2.core.serialiseToObject()
		assert.equal(ser.root.nodes[0].uiSlotValues.a, true)
	})

	it('changes slot default (ui) when no override', function() {
		var slot = orNode.findInputSlotByName('a')
		slot.def = 3
		E2.app.graphApi
			.changeInputSlotValue(graph, orNode, 'a', 3)
		assert.equal(orNode.getInputSlotValue('a'), 3)
	})

	it('refuses if slot is connected', function() {
		var slot = orNode.findInputSlotByName('a')
		slot.is_connected = true
		E2.app.graphApi
			.changeInputSlotValue(graph, orNode, 'a', false)
		assert.equal(orNode.getInputSlotValue('a'), true)
	})

	it('can deserialize slot values', function() {
		var ser = E2.core.serialise()
		graph = E2.core.deserialise(ser)

		assert.equal(graph.nodes[0]
			.getInputSlotValue('a'), true)
	})

	it('calls update_input before update_state', function(done) {
		var updateInputCalled = false
		orNode.plugin.update_input = function() {
			updateInputCalled = true
		}
		orNode.plugin.update_state = function() {
			assert.ok(updateInputCalled)
			done()
		}
		E2.app.graphApi
			.changeInputSlotValue(graph, orNode, 'a', false)

		graph.update()
	})

	it('uses uiValue after input is disconnected', function(done) {
		var updateCalled = false

		var boolToggle = E2.app.instantiatePlugin('toggle_button')
		var conn = connect(graph, boolToggle, 0, orNode, 0, false)
		graph.update()

		orNode.plugin.update_input = function() {
			updateCalled = true
		}
		orNode.plugin.update_state = function() {
			assert.ok(updateCalled, 'should have called update upon disconnecting')
			assert.equal(this.parentNode.getInputSlotValue('a'), true)
			done()
		}
		disconnect(graph, conn)
		graph.update()
	})


	it('returns correct uiValue regardless of connection status', function(done) {
		var boolToggle = E2.app.instantiatePlugin('toggle_button')

		var slotA = orNode.findInputSlotByName('a')

		assert.equal(orNode.getUiSlotValue(slotA), true, 'correctly setup uiValue for A')

		var conn = connect(graph, boolToggle, 0, orNode, 0, false)
		graph.update()

		assert.equal(orNode.getInputSlotValue('a'), false, 'input A is updated')
		assert.equal(orNode.getUiSlotValue(slotA), true, 'uiValue for A remains true')

		done()
	})

})


