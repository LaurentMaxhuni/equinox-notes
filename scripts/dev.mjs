import { spawn } from 'node:child_process';

const processes = [
  { name: 'server', args: ['run', 'dev', '--workspace', 'server'] },
  { name: 'client', args: ['run', 'dev', '--workspace', 'client'] },
];

const running = new Set();

const spawnProcess = ({ name, args }) => {
  const child = spawn('npm', args, { stdio: 'inherit', shell: true });
  running.add(child);
  child.on('exit', (code) => {
    running.delete(child);
    if (code && code !== 0) {
      console.error(`${name} exited with code ${code}`);
      for (const other of running) {
        other.kill('SIGINT');
      }
      process.exitCode = code;
    }
  });
  return child;
};

processes.forEach(spawnProcess);

const cleanExit = () => {
  for (const child of running) {
    child.kill('SIGINT');
  }
  process.exit();
};

process.on('SIGINT', cleanExit);
process.on('SIGTERM', cleanExit);
