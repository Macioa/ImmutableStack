import { execute } from "./index";
import { mkdirSync, writeFileSync, unlinkSync, rmdirSync } from "fs";
import { join } from "path";

const testDir = "/tmp/runner_test";
const testFile = join(testDir, "test_output.txt");

const setup = () => {
  try {
    mkdirSync(testDir, { recursive: true });
    writeFileSync(testFile, "");
  } catch (e) {
    console.log("Setup error:", e);
  }
};

const cleanup = () => {
  try {
    unlinkSync(testFile);
    rmdirSync(testDir);
  } catch (e) {
    console.log("Cleanup error:", e);
  }
};

const log = (test: string, result: any) => {
  console.log(`\n=== ${test} ===`);
  console.log("Result:", result);
  try {
    const output = require("fs").readFileSync(testFile, "utf8");
    console.log("Output file contents:", output);
  } catch (e) {
    console.log("No output file or error reading:", e.message);
  }
};

const runTests = async () => {
  setup();
  
  console.log("Starting comprehensive runner tests...\n");

  try {
    await execute({
      dir: testDir,
      command: `echo "basic test" > ${testFile}`
    });
    log("Basic execution", "success");
  } catch (e) {
    log("Basic execution", e.message);
  }

  try {
    await execute({
      dir: testDir,
      command: [
        `echo "command1" >> ${testFile}`,
        `echo "command2" >> ${testFile}`
      ]
    });
    log("Multiple commands", "success");
  } catch (e) {
    log("Multiple commands", e.message);
  }

  try {
    await execute({
      dir: testDir,
      command: `echo "prereq success" >> ${testFile}`,
      prereq: {
        command: "echo 'prereq executed' >> " + testFile,
        dir: testDir
      }
    });
    log("Prereq success", "success");
  } catch (e) {
    log("Prereq success", e.message);
  }

  try {
    await execute({
      dir: testDir,
      command: `echo "prereq fail no recover" >> ${testFile}`,
      prereq: {
        command: "exit 1",
        dir: testDir
      }
    });
    log("Prereq fail no recover", "should have failed");
  } catch (e) {
    log("Prereq fail no recover", e.message);
  }

  try {
    await execute({
      dir: testDir,
      command: `echo "prereq fail with recover" >> ${testFile}`,
      prereq: {
        command: "exit 1",
        dir: testDir,
        recover: `echo "recovery executed" >> ${testFile}`
      }
    });
    log("Prereq fail with single recover", "success");
  } catch (e) {
    log("Prereq fail with single recover", e.message);
  }

  try {
    await execute({
      dir: testDir,
      command: `echo "prereq fail with multiple recover" >> ${testFile}`,
      prereq: {
        command: "exit 1",
        dir: testDir,
        recover: [
          `echo "recovery1" >> ${testFile}`,
          `echo "recovery2" >> ${testFile}`
        ]
      }
    });
    log("Prereq fail with multiple recover", "success");
  } catch (e) {
    log("Prereq fail with multiple recover", e.message);
  }

  try {
    await execute({
      dir: testDir,
      command: [
        `echo "primary1" >> ${testFile}`,
        `echo "primary2" >> ${testFile}`
      ],
      prereq: {
        command: "exit 1",
        dir: testDir,
        recover: [
          `echo "recovery1" >> ${testFile}`,
          `echo "recovery2" >> ${testFile}`
        ]
      }
    });
    log("Multiple commands with prereq recovery", "success");
  } catch (e) {
    log("Multiple commands with prereq recovery", e.message);
  }

  try {
    const subDir = join(testDir, "subdir");
    await execute({
      dir: subDir,
      command: `echo "dir inheritance test" >> ${join(subDir, "sub_output.txt")}`,
      prereq: {
        command: "echo 'prereq in subdir' >> " + join(subDir, "sub_output.txt")
      }
    });
    log("Directory inheritance", "success");
  } catch (e) {
    log("Directory inheritance", e.message);
  }

  try {
    await execute({
      dir: testDir,
      command: `echo "final test" >> ${testFile}`,
      prereq: {
        command: "echo 'prereq before final' >> " + testFile,
        dir: testDir
      }
    });
    log("Execution order verification", "success");
  } catch (e) {
    log("Execution order verification", e.message);
  }

  console.log("\n=== EXIT CODE VALIDATION TESTS ===\n");

  try {
    await execute({
      dir: testDir,
      command: `echo "exit 0 test" >> ${testFile}`,
      prereq: {
        command: "exit 0",
        dir: testDir
      }
    });
    log("Prereq exit 0 (success)", "success");
  } catch (e) {
    log("Prereq exit 0 (success)", e.message);
  }

  try {
    await execute({
      dir: testDir,
      command: `echo "exit 2 test" >> ${testFile}`,
      prereq: {
        command: "exit 2",
        dir: testDir,
        recover: `echo "recovery for exit 2" >> ${testFile}`
      }
    });
    log("Prereq exit 2 (non-zero) with recovery", "success");
  } catch (e) {
    log("Prereq exit 2 (non-zero) with recovery", e.message);
  }

  try {
    await execute({
      dir: testDir,
      command: `echo "exit 127 test" >> ${testFile}`,
      prereq: {
        command: "exit 127",
        dir: testDir,
        recover: `echo "recovery for exit 127" >> ${testFile}`
      }
    });
    log("Prereq exit 127 (command not found) with recovery", "success");
  } catch (e) {
    log("Prereq exit 127 (command not found) with recovery", e.message);
  }

  console.log("\n=== BASH BOOLEAN VALIDATION TESTS ===\n");

  try {
    await execute({
      dir: testDir,
      command: `echo "true test" >> ${testFile}`,
      prereq: {
        command: "true",
        dir: testDir
      }
    });
    log("Prereq 'true' command", "success");
  } catch (e) {
    log("Prereq 'true' command", e.message);
  }

  try {
    await execute({
      dir: testDir,
      command: `echo "false test" >> ${testFile}`,
      prereq: {
        command: "false",
        dir: testDir,
        recover: `echo "recovery for false" >> ${testFile}`
      }
    });
    log("Prereq 'false' command with recovery", "success");
  } catch (e) {
    log("Prereq 'false' command with recovery", e.message);
  }

  try {
    await execute({
      dir: testDir,
      command: `echo "test command success" >> ${testFile}`,
      prereq: {
        command: "test 1 -eq 1",
        dir: testDir
      }
    });
    log("Prereq 'test 1 -eq 1' (true)", "success");
  } catch (e) {
    log("Prereq 'test 1 -eq 1' (true)", e.message);
  }

  try {
    await execute({
      dir: testDir,
      command: `echo "test command failure" >> ${testFile}`,
      prereq: {
        command: "test 1 -eq 2",
        dir: testDir,
        recover: `echo "recovery for test failure" >> ${testFile}`
      }
    });
    log("Prereq 'test 1 -eq 2' (false) with recovery", "success");
  } catch (e) {
    log("Prereq 'test 1 -eq 2' (false) with recovery", e.message);
  }

  try {
    await execute({
      dir: testDir,
      command: `echo "file exists test" >> ${testFile}`,
      prereq: {
        command: `test -f ${testFile}`,
        dir: testDir
      }
    });
    log("Prereq 'test -f file' (file exists)", "success");
  } catch (e) {
    log("Prereq 'test -f file' (file exists)", e.message);
  }

  try {
    await execute({
      dir: testDir,
      command: `echo "file not exists test" >> ${testFile}`,
      prereq: {
        command: "test -f /nonexistent/file",
        dir: testDir,
        recover: `echo "recovery for file not found" >> ${testFile}`
      }
    });
    log("Prereq 'test -f /nonexistent/file' (false) with recovery", "success");
  } catch (e) {
    log("Prereq 'test -f /nonexistent/file' (false) with recovery", e.message);
  }

  console.log("\n=== COMPLEX SCENARIO TESTS ===\n");

  try {
    await execute({
      dir: testDir,
      command: [
        `echo "complex1" >> ${testFile}`,
        `echo "complex2" >> ${testFile}`,
        `echo "complex3" >> ${testFile}`
      ],
      prereq: {
        command: "test 5 -gt 3",
        dir: testDir,
        recover: [
          `echo "complex_recovery1" >> ${testFile}`,
          `echo "complex_recovery2" >> ${testFile}`
        ]
      }
    });
    log("Complex: multiple commands with true prereq", "success");
  } catch (e) {
    log("Complex: multiple commands with true prereq", e.message);
  }

  try {
    await execute({
      dir: testDir,
      command: [
        `echo "complex_fail1" >> ${testFile}`,
        `echo "complex_fail2" >> ${testFile}`
      ],
      prereq: {
        command: "test 1 -gt 5",
        dir: testDir,
        recover: [
          `echo "complex_fail_recovery1" >> ${testFile}`,
          `echo "complex_fail_recovery2" >> ${testFile}`,
          `echo "complex_fail_recovery3" >> ${testFile}`
        ]
      }
    });
    log("Complex: multiple commands with false prereq and multiple recovery", "success");
  } catch (e) {
    log("Complex: multiple commands with false prereq and multiple recovery", e.message);
  }

  console.log("\n=== BACKWARD COMPATIBILITY TESTS ===\n");

  try {
    await execute({
      command: `echo "backward compatibility test" >> ${testFile}`,
      dir: testDir
    }, "backward_compat_test");
    log("Backward compatibility: basic usage", "success");
  } catch (e) {
    log("Backward compatibility: basic usage", e.message);
  }

  try {
    await execute({
      command: `mix deps.get`,
      dir: testDir,
      options: { resolveOnErrorCode: true }
    }, "backward_compat_test");
    log("Backward compatibility: mix command with resolveOnErrorCode", "success");
  } catch (e) {
    log("Backward compatibility: mix command with resolveOnErrorCode", e.message);
  }

  try {
    await execute({
      command: `mkdir -p test_project`,
      dir: testDir
    }, "backward_compat_test");
    log("Backward compatibility: mkdir command", "success");
  } catch (e) {
    log("Backward compatibility: mkdir command", e.message);
  }

  try {
    await execute({
      command: `yes | echo "phoenix new test"`,
      dir: testDir,
      options: { 
        prompts: [["Continue?", "y"]],
        forceReturnOnPrompt: true 
      }
    }, "backward_compat_test");
    log("Backward compatibility: command with prompts", "success");
  } catch (e) {
    log("Backward compatibility: command with prompts", e.message);
  }

  try {
    await execute({
      command: `mix phx.gen.context TestContext TestSchema name:string --no-prompts`,
      dir: testDir,
      options: { resolveOnErrorCode: true }
    }, "gen_context");
    log("Backward compatibility: phx.gen.context command", "success");
  } catch (e) {
    log("Backward compatibility: phx.gen.context command", e.message);
  }

  try {
    await execute({
      command: `mix compile`,
      dir: testDir,
      options: { resolveOnErrorCode: true }
    }, "init_proj");
    log("Backward compatibility: mix compile command", "success");
  } catch (e) {
    log("Backward compatibility: mix compile command", e.message);
  }

  console.log("\n=== Final Output ===");
  try {
    const finalOutput = require("fs").readFileSync(testFile, "utf8");
    console.log("Complete output file:");
    console.log(finalOutput);
  } catch (e) {
    console.log("Error reading final output:", e.message);
  }

  cleanup();
};

runTests().catch(console.error);
