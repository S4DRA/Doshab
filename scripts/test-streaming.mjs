import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import Module from "node:module";
import path from "node:path";
import { test } from "node:test";
import ts from "typescript";
import { Track } from "livekit-client";

function load(relative) {
  const file = path.resolve(relative);
  const compiled = new Module(file);
  compiled.filename = file;
  compiled.paths = Module._nodeModulePaths(path.dirname(file));
  compiled._compile(ts.transpileModule(readFileSync(file, "utf8"), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  }).outputText, file);
  return compiled.exports;
}

const { participantAudioVolume } = load("lib/participant-audio.ts");
const { getStreamOptions, defaultStreamSettings, streamPresets } = load("lib/stream-settings.ts");
const preference = { localVolume: 80, locallyMuted: false, streamVolume: 25, streamMuted: false };

test("lowering or muting a stream leaves the participant microphone unchanged", () => {
  for (const streamVolume of [0, 25, 100]) {
    for (const streamMuted of [true, false]) {
      const state = { ...preference, streamVolume, streamMuted };
      assert.equal(participantAudioVolume(Track.Source.Microphone, state), 0.8);
      assert.equal(participantAudioVolume(Track.Source.ScreenShareAudio, state), streamMuted ? 0 : streamVolume / 100);
    }
  }
});

test("voice mute does not silence stream audio; volumes stay within browser bounds", () => {
  assert.equal(participantAudioVolume(Track.Source.ScreenShareAudio, { ...preference, locallyMuted: true }), 0.25);
  assert.equal(participantAudioVolume(Track.Source.Microphone, { ...preference, locallyMuted: true }), 0);
  assert.equal(participantAudioVolume(Track.Source.Microphone, { ...preference, localVolume: 200 }), 1);
  assert.equal(participantAudioVolume(Track.Source.Unknown, preference), 0.8);
});

test("all stream combinations produce bounded capture and encoding options", () => {
  for (const preset of Object.keys(streamPresets)) for (const frameRate of [15, 30, 60]) {
    for (const content of ["detail", "motion"]) for (const audio of ["off", "standard", "high"]) {
      const { capture, publish } = getStreamOptions({ preset, frameRate, content, audio });
      assert.equal(capture.resolution.frameRate, frameRate);
      assert.equal(publish.screenShareEncoding.maxFramerate, frameRate);
      assert.ok(publish.screenShareEncoding.maxBitrate > 0 && publish.screenShareEncoding.maxBitrate <= 16_000_000);
      assert.equal(capture.audio !== false, audio !== "off");
      assert.equal(publish.simulcast, true);
      assert.equal(publish.degradationPreference, content === "detail" ? "maintain-resolution" : "maintain-framerate");
    }
  }
  const defaults = getStreamOptions(defaultStreamSettings);
  assert.equal(defaults.capture.resolution.height, 1080);
  assert.equal(defaults.capture.audio.noiseSuppression, false);
  assert.equal(defaults.capture.audio.echoCancellation, false);
});
