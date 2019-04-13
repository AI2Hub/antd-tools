const chalk = require('chalk');
const { createSourceFile, ScriptTarget, SyntaxKind, forEachChild } = require('typescript');

// Get AST node kind
function getKind(node) {
  return SyntaxKind[node.kind];
}

function getRoot(node) {
  let root = node;
  while (root.parent) {
    root = root.parent;
  }
  return root;
}

function debugNode(node, title, type) {
  const clone = { ...node };
  delete clone.parent;

  const args = [ chalk.cyan('[DEBUG]'), chalk.green(getKind(node)), title ];

  switch (type) {
    case 'code':
      const { text } = getRoot(node);
      args.push(chalk.yellow(`\n${text.slice(node.pos, node.end).trim()}`));
      args.push(chalk.gray(text.substr(node.end, 15)));
      break;
    case 'node':
      args.push(clone);
      break;
  }

  console.log(...args);
}

// Breadth-First Search
function BFS(node, callback) {
  let subNodes = [];

  let breakLoop = false;
  forEachChild(node, (subNode) => {
    // Clean up stack
    if (breakLoop) {
      subNodes = [];
      return;
    }

    subNodes.push(subNode);

    if (callback(subNode) === false) {
      breakLoop = true;
      return false;
    }
  });

  subNodes.forEach((subNode) => {
    BFS(subNode, callback);
  });
}

// class My extends Component;
// export default My;
function findExportDefine(sourceFile) {
  let matchNode = null;
  BFS(sourceFile, (node) => {
    if (node.kind === SyntaxKind.ExportAssignment) {
      matchNode = node;
      return false;
    }
  });
  return matchNode;
}

// export default class My extends Component;
function findExportDirectly(sourceFile) {
  let matchNode = null;
  let matchPattern = 0; // export: 1, default: 2

  BFS(sourceFile, (node) => {
    if (matchPattern === 0 && node.kind === SyntaxKind.ExportKeyword) {
      matchPattern = 1;
      return;
    } else if (matchPattern === 1 && node.kind === SyntaxKind.DefaultKeyword) {
      matchPattern = 2;
      return;
    }

    if (matchPattern === 2) {
      matchNode = node;
      return false;
    }
    matchPattern = 0;
  });

  return matchNode;
}

function findExport(sourceFile) {
  const node = findExportDefine(sourceFile) || findExportDirectly(sourceFile);
  if (node) {
    debugNode(node, 'YES', 'node');
    console.log(chalk.green('Match!!!'));
  }
}

module.exports = {
  findExport,
};
