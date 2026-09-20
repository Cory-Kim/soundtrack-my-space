import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

import { getFadeVolume } from '../src/audioUtils.js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

test('sleep fade remains at full volume until its fade window', () => {
  assert.equal(getFadeVolume(120, true, 60), 1)
  assert.equal(getFadeVolume(30, false, 60), 1)
})

test('sleep fade decreases smoothly and never becomes negative', () => {
  assert.equal(getFadeVolume(60, true, 60), 1)
  assert.equal(getFadeVolume(30, true, 60), 0.5)
  assert.equal(getFadeVolume(0, true, 60), 0)
  assert.equal(getFadeVolume(-10, true, 60), 0)
})

test('invalid fade durations do not produce NaN volume values', () => {
  assert.equal(getFadeVolume(10, true, 0), 1)
  assert.equal(getFadeVolume(10, true, Number.NaN), 1)
})

test('every catalog variant points to a bundled audio file', () => {
  const catalog = JSON.parse(readFileSync(path.join(root, 'src/data/audioCatalog.json'), 'utf8'))
  const layers = Object.entries(catalog)
  assert.ok(layers.length > 0)

  for (const [layerId, variants] of layers) {
    assert.ok(Array.isArray(variants) && variants.length > 0, `${layerId} needs variants`)
    for (const variant of variants) {
      assert.ok(variant.id, `${layerId} has a variant without an id`)
      const audioPath = path.join(root, 'public', 'assets', 'audio', variant.sourceFile)
      assert.equal(existsSync(audioPath), true, `${variant.sourceFile} is missing`)
    }
  }
})
