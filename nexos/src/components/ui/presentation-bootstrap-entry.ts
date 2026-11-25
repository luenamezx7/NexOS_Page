import { startPresentationRuntime } from './presentation-runtime';
const dialog = document.currentScript?.previousElementSibling;
if (dialog instanceof HTMLDialogElement) startPresentationRuntime(dialog);
