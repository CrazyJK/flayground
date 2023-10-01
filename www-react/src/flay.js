import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './flay.scss';
import { Flay } from './flay/Flay.jsx';

const container = document.getElementById('app');
const root = createRoot(container);

const opusList = await fetchOpus();

renderFlay();

async function renderFlay() {
  let opus = getOpus();
  console.log('renderFlay opus', opus);

  const [flay, actressList] = await fetchFlay(opus);

  root.render(
    <StrictMode>
      <Flay flay={flay} actress={actressList} />
    </StrictMode>,
  );
}

function getOpus() {
  let opusIndex = Math.floor(Math.random() * opusList.length);
  return opusList[opusIndex];
}

async function fetchOpus() {
  const res = await fetch('/flay/list/opus', { method: 'post', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
  const opusList = await res.json();
  console.log('fetchOpus', opusList);
  return opusList;
}

async function fetchFlay(opus) {
  // axios
  const res = await fetch('/flay/' + opus + '/fully');
  const fullyFlay = await res.json();
  console.log('fetchFlay', fullyFlay);
  return [fullyFlay.flay, fullyFlay.actress];
}
