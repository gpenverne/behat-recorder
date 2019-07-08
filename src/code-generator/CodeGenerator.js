import domEvents from './dom-events-to-record'
import pptrActions from './pptr-actions'
import Block from './Block'

const tab = '    '
const featureTitle = `Feature: my feature name\n\n${tab}Scenario: my scenario\n`

export const defaults = {
  wrapAsync: true,
  headless: true,
  waitForNavigation: true,
  waitForSelectorOnClick: true,
  blankLinesBetweenBlocks: true,
  dataAttribute: ''
}

export default class CodeGenerator {
  constructor (options) {
    this._options = Object.assign(defaults, options)
    this._blocks = []
    this._frame = 'page'
    this._frameId = 0
    this._allFrames = {}
    this._screenshotCounter = 1
  }

  generate (events) {
    return featureTitle + this._parseEvents(events)
  }

  _parseEvents (events) {
    console.debug(`generating code for ${events ? events.length : 0} events`)
    let result = ''

    if (!events) return result

    for (let i = 0; i < events.length; i++) {
      const { action, selector, value, href, keyCode, tagName, frameId, frameUrl } = events[i]

      // we need to keep a handle on what frames events originate from
      this._setFrames(frameId, frameUrl)
      switch (action) {
        case 'keydown':
          this._blocks.push(this._handleKeyDown(selector, value, keyCode))
          break
        case 'click':
          this._blocks.push(this._handleClick(selector, events))
          break
        case 'change':
          this._blocks.push(this._handleChange(selector, value))
          break
        case pptrActions.GOTO:
            this._blocks.push(this._handleGoto(href, frameId))
          break
        case pptrActions.SCREENSHOT:
          this._blocks.push(this._handleScreenshot(value))
          break
      }
    }
    const indent = `${tab}${tab}`
    const newLine = `\n`

    for (let block of this._blocks) {
      if (typeof block == 'undefined') {
           continue;
      }
      const lines = block.getLines()
      for (let line of lines) {
        result += indent + line.value + newLine
      }
    }

    return result
  }

  _setFrames (frameId, frameUrl) {
    if (frameId && frameId !== 0) {
      this._frameId = frameId
      this._frame = `frame_${frameId}`
      this._allFrames[frameId] = frameUrl
    } else {
      this._frameId = 0
      this._frame = 'page'
    }
  }

  _handleKeyDown (selector, value) {

  }

  _handleNavigation(href) {
    return new Block(this._frameId, { type: pptrActions.GOTO, value: `Then I should be on '${href}'` })
  }

  _handleClick (selector) {
    const block = new Block(this._frameId)
    block.addLine({ type: domEvents.CLICK, value: `Then the element '${selector}' should exist` })
    block.addLine({ type: domEvents.CLICK, value: `Given I click on '${selector}'` })
    return block
  }
  _handleChange (selector, value) {
    return new Block(this._frameId, { type: domEvents.CHANGE, value: `Given I type '${value}' in field '${selector}'` })
  }
  _handleGoto (href) {
    return new Block(this._frameId, { type: pptrActions.GOTO, value: `Given I go on '${href}'` })
  }

  _handleScreenshot (options) {
    let block
    block = new Block(this._frameId, {
        type: pptrActions.SCREENSHOT,
        value: `Take a screenshot `
    })
    this._screenshotCounter++
    return block
  }

}
