import { mount } from 'svelte';
import App from './App.svelte';
import './app.css';

const target = document.getElementById('app');
if (target === null) throw new Error('#app nicht gefunden');

mount(App, { target });
