import './styles/tokens.css';
import './styles/base.css';
import './styles/ui.css';

import gsap from 'gsap';
import { App } from './core/App';

// One shared ticker already runs the render loop; GSAP keeps its own, which is
// correct here — it drives DOM transforms that must stay in sync with the
// compositor, not with WebGL.
gsap.config({ nullTargetWarn: false });
gsap.defaults({ overwrite: 'auto' });

const app = new App();
app.start().catch((err) => {
  console.error(err);
  document.getElementById('boot')?.remove();
  document.getElementById('unsupported')?.removeAttribute('hidden');
});
