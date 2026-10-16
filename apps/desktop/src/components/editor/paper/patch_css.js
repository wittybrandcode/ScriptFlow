import fs from 'fs';

const p = 'd:/SCRIPTFLOW Pro/SCRIPTFLOW ENREPRISE/apps/desktop/src/components/editor/paper/paper-editor.css';
let content = fs.readFileSync(p, 'utf-8');

// The shared block rules
const oldShared = `/* Shared block rules */
  .paper-block {
    display: flex;
    align-items: center;
    min-height: var(--paper-line-height);
    position: relative;
  }`;
const newShared = `/* Shared block rules */
  .paper-block {
    display: flex;
    align-items: center;
    min-height: var(--paper-line-height);
    position: relative;
    text-align: right; /* Default text alignment for Arabic */
  }`;

// Action
const oldAction = `/* Action Node */
  .paper-node-action {
    font-weight: 500;
    width: 100%;
    text-align: justify;
  }`;
const newAction = `/* Action Node */
  .paper-node-action {
    font-weight: 500;
    width: 100%;
    text-align: right;
  }`;

// Dialogue
const oldDialogue = `/* Dialogue Node */
  .paper-node-dialogue {
    font-weight: 400;
    text-align: center;
    width: 60%;
    margin-left: auto !important;
    margin-right: auto !important;
  }`;
const newDialogue = `/* Dialogue Node */
  .paper-node-dialogue {
    font-weight: 500;
    text-align: right;
    width: 85%; /* Match 85% width of ScenePaperRenderer */
    margin-left: auto !important;
    margin-right: auto !important;
  }`;

// Transition
const oldTransition = `/* Transition Node */
  .paper-node-transition {
    font-weight: 800;
    font-size: 11px;
    text-align: left;
    width: 100%;
    text-transform: uppercase;
    letter-spacing: 2px;
    margin-top: var(--paper-line-height) !important;
  }`;
const newTransition = `/* Transition Node */
  .paper-node-transition {
    font-weight: 800;
    font-size: 11px;
    text-align: left;
    width: 100%;
    text-transform: uppercase;
    letter-spacing: 2px;
    margin-top: var(--paper-line-height) !important;
  }`;

content = content.replace(oldShared, newShared);
content = content.replace(oldAction, newAction);
content = content.replace(oldDialogue, newDialogue);

fs.writeFileSync(p, content);
console.log('Patched CSS successfully.');
