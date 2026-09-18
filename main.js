import { setAssetBase } from 'https://yachiyo.net/game/pancake/js/constants.js';
import { resetState, getState, setState } from 'https://yachiyo.net/game/pancake/js/state.js';
import { initI18n } from 'https://yachiyo.net/game/pancake/js/i18n.js';
import { SCENE } from 'https://yachiyo.net/game/pancake/js/constants.js';
import { startBGM, teardown as audioTeardown } from 'https://yachiyo.net/game/pancake/js/audio.js';
import * as intro from 'https://yachiyo.net/game/pancake/js/scenes/intro.js';
import * as dough from 'https://yachiyo.net/game/pancake/js/scenes/dough.js';
import * as mart from 'https://yachiyo.net/game/pancake/js/scenes/mart.js';
import * as topping from 'https://yachiyo.net/game/pancake/js/scenes/topping.js';
import * as cook from 'https://yachiyo.net/game/pancake/js/scenes/cook.js';
import * as result from 'https://yachiyo.net/game/pancake/js/scenes/result.js';

const scenes = {
    [SCENE.INTRO]: intro,
    [SCENE.DOUGH]: dough,
    [SCENE.MART]: mart,
    [SCENE.TOPPING]: topping,
    [SCENE.COOK]: cook,
    [SCENE.RESULT]: result,
};

let currentScene = null;

function goToScene(next) {
    const state = getState();
    const prev = state.scene;
    if (prev === next) return;

    const prevScene = scenes[prev];
    if (prevScene && typeof prevScene.exit === 'function') {
        prevScene.exit();
    }

    const nextScene = scenes[next];
    if (nextScene && typeof nextScene.enter === 'function') {
        nextScene.enter();
    }
    if (nextScene && typeof nextScene.update === 'function') {
        nextScene.update();
    }

    setState({ scene: next });
    currentScene = next;
}

const docPath = typeof window !== 'undefined' && window.location.pathname;
const basePath = docPath ? (docPath.endsWith('/') ? docPath : docPath.replace(/\/[^/]*$/, '/')) : '';
setAssetBase(basePath);

window.__pancakeGoToScene = goToScene;

window.__pancakeTeardown = function () {
    audioTeardown();
};
window.addEventListener('message', function (e) {
    if (e.data && e.data.type === 'pancake-teardown') {
        audioTeardown();
    }
});

function showInitError(msg) {
    const stage = document.getElementById('pancake-stage');
    if (stage) {
        stage.innerHTML = '<div style="padding:1rem;color:#fff;font-family:system-ui,sans-serif;text-align:center;white-space:pre-wrap;">' +
            '로드 실패\n\n' + String(msg) + '</div>';
    }
    console.error('[pancake]', msg);
}

(async function init() {
    const root = document.getElementById('pancake-root');
    const stage = document.getElementById('pancake-stage');
    if (!root || !stage) {
        showInitError('pancake-root 또는 pancake-stage를 찾을 수 없습니다.');
        return;
    }

    window.__pancakeReady = true;

    try {
        const base = typeof window.PANCAKE_ASSET_BASE !== 'undefined' ? window.PANCAKE_ASSET_BASE : basePath;
        await initI18n({ localesBaseUrl: base + 'locales/' });

        resetState();
        goToScene(SCENE.INTRO);
        startBGM();

        if (typeof history !== 'undefined' && history.pushState) {
            history.pushState({ pancake: true }, '', window.location.pathname + window.location.search + window.location.hash);
            window.addEventListener('popstate', () => {
                resetState();
                goToScene(SCENE.INTRO);
                history.pushState({ pancake: true }, '', window.location.pathname + window.location.search + window.location.hash);
            });
        }
    } catch (e) {
        showInitError(e.message || String(e));
    }
})();
