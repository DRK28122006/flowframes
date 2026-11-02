import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

export async function synthesize(text, outBase) {
  const textFile = path.resolve(outBase + ".txt");
  const wavFile = path.resolve(outBase + ".wav");
  fs.writeFileSync(textFile, text, "utf8");   // via a file, so quotes in the text can't break the command

  const q = (s) => s.replace(/'/g, "''");     // PowerShell single-quote escaping
  const script = `
    Add-Type -AssemblyName System.Speech
    $s = New-Object System.Speech.Synthesis.SpeechSynthesizer
    $s.SetOutputToWaveFile('${q(wavFile)}')
    $s.Speak((Get-Content -Raw -Encoding UTF8 '${q(textFile)}'))
    $s.Dispose()
  `;
  const r = spawnSync("powershell", ["-NoProfile", "-Command", script], { encoding: "utf8" });
  if (r.status !== 0) throw new Error("Windows speech failed: " + r.stderr);
  return wavFile;
}