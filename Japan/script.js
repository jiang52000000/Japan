document.addEventListener('DOMContentLoaded', function() {
    // ========== 多源 TTS 在线音频系统 ==========
    // GitHub Pages 兼容，多发音人切换

    var globalAudio = new Audio();
    var currentPlayingEl = null;
    var lastWorkingClient = 'gtx';
    var googleClients = ['gtx', 'tw-ob', 'dict-chrome-ex'];

    // ========== 发音人配置 ==========
    // 每个发音人 = 一种在线 TTS 语言/语速组合 + 系统本地语音
    var voiceList = [
        { id: 'ja-female',   label: '日语女声',      lang: 'ja',    speed: 1.0,  type: 'online' },
        { id: 'ja-slow',     label: '日语慢速',      lang: 'ja',    speed: 0.3,  type: 'online' },
        { id: 'ja-male',     label: '日语男声(本地)', lang: 'ja-JP', speed: 0.8,  type: 'local', preferMale: true },
        { id: 'ja-local',    label: '本地日语语音',   lang: 'ja-JP', speed: 0.8,  type: 'local', preferMale: false }
    ];
    var currentVoiceId = 'ja-female';

    // ========== 顶部语音选择栏 ==========
    function createVoiceBar() {
        var bar = document.createElement('div');
        bar.id = 'voiceBar';
        bar.className = 'voice-bar';

        var label = document.createElement('span');
        label.className = 'voice-bar-label';
        label.textContent = '发音：';
        bar.appendChild(label);

        var select = document.createElement('select');
        select.id = 'voiceSelect';
        select.className = 'voice-bar-select';

        voiceList.forEach(function(v) {
            var opt = document.createElement('option');
            opt.value = v.id;
            opt.textContent = v.label;
            select.appendChild(opt);
        });

        // 检测系统本地日语语音，动态添加
        if (window.speechSynthesis) {
            var addLocalVoices = function() {
                var voices = speechSynthesis.getVoices();
                var jaVoices = voices.filter(function(v) {
                    return v.lang && v.lang.indexOf('ja') === 0;
                });
                // 移除旧的本地选项（id 以 local- 开头）
                for (var i = select.options.length - 1; i >= 0; i--) {
                    if (select.options[i].value.indexOf('sys-') === 0) {
                        select.remove(i);
                    }
                }
                jaVoices.forEach(function(v, idx) {
                    var opt = document.createElement('option');
                    opt.value = 'sys-' + idx;
                    var name = v.name.replace(/Microsoft |Google |Apple |com\.apple\.voice\.|premium|enhanced/gi, '').trim();
                    opt.textContent = '本地: ' + name;
                    select.appendChild(opt);
                    // 注册到 voiceList
                    voiceList.push({
                        id: 'sys-' + idx,
                        label: '本地: ' + name,
                        lang: v.lang,
                        speed: 0.8,
                        type: 'system',
                        voiceObj: v
                    });
                });
            };
            if (speechSynthesis.getVoices().length > 0) {
                addLocalVoices();
            }
            speechSynthesis.onvoiceschanged = addLocalVoices;
        }

        select.addEventListener('change', function() {
            currentVoiceId = this.value;
        });

        bar.appendChild(select);

        // 测试按钮
        var testBtn = document.createElement('button');
        testBtn.className = 'voice-bar-test';
        testBtn.textContent = '试听';
        testBtn.addEventListener('click', function() {
            speakJapanese('こんにちは');
        });
        bar.appendChild(testBtn);

        // 插入到 header 之后，或 container 的最前面
        var container = document.querySelector('.container');
        var header = container ? container.querySelector('header') : null;
        if (header && header.nextSibling) {
            container.insertBefore(bar, header.nextSibling);
        } else if (container) {
            container.insertBefore(bar, container.firstChild);
        } else {
            document.body.insertBefore(bar, document.body.firstChild);
        }
    }

    // 注入样式
    function injectVoiceBarStyles() {
        var style = document.createElement('style');
        style.textContent = [
            '.voice-bar {',
            '  display: flex;',
            '  align-items: center;',
            '  gap: 10px;',
            '  padding: 10px 15px;',
            '  margin-bottom: 15px;',
            '  background: linear-gradient(135deg, #fff5f5, #fff);',
            '  border: 1px solid #f0d0d0;',
            '  border-radius: 8px;',
            '  flex-wrap: wrap;',
            '  font-size: 14px;',
            '}',
            '.voice-bar-label {',
            '  font-weight: 600;',
            '  color: #e74c3c;',
            '  white-space: nowrap;',
            '}',
            '.voice-bar-select {',
            '  flex: 1;',
            '  min-width: 120px;',
            '  padding: 8px 12px;',
            '  border: 1px solid #ddd;',
            '  border-radius: 6px;',
            '  font-size: 14px;',
            '  background: #fff;',
            '  color: #333;',
            '  cursor: pointer;',
            '  outline: none;',
            '}',
            '.voice-bar-select:focus {',
            '  border-color: #e74c3c;',
            '  box-shadow: 0 0 0 2px rgba(231,76,60,0.15);',
            '}',
            '.voice-bar-test {',
            '  padding: 8px 16px;',
            '  background: #e74c3c;',
            '  color: #fff;',
            '  border: none;',
            '  border-radius: 6px;',
            '  cursor: pointer;',
            '  font-size: 13px;',
            '  white-space: nowrap;',
            '  transition: background 0.2s;',
            '}',
            '.voice-bar-test:hover {',
            '  background: #c0392b;',
            '}',
            '.voice-bar-test:active {',
            '  transform: scale(0.96);',
            '}',
            '@media (max-width: 768px) {',
            '  .voice-bar {',
            '    padding: 8px 10px;',
            '    gap: 8px;',
            '  }',
            '  .voice-bar-select {',
            '    min-width: 0;',
            '    font-size: 13px;',
            '    padding: 8px;',
            '  }',
            '  .voice-bar-test {',
            '    padding: 8px 12px;',
            '  }',
            '}'
        ].join('\n');
        document.head.appendChild(style);
    }

    // ========== 获取当前选中的语音配置 ==========
    function getCurrentVoice() {
        for (var i = 0; i < voiceList.length; i++) {
            if (voiceList[i].id === currentVoiceId) return voiceList[i];
        }
        return voiceList[0];
    }

    // ========== 在线 Google TTS ==========
    function buildGoogleUrl(text, lang, speed, client) {
        var spd = speed < 0.5 ? '0.3' : '1';
        return 'https://translate.googleapis.com/translate_tts?ie=UTF-8&client=' +
            client + '&tl=' + lang + '&ttsspeed=' + spd +
            '&q=' + encodeURIComponent(text);
    }

    function playOnline(text, voice) {
        return new Promise(function(resolve) {
            var clients = googleClients.slice();
            // 优先用上次成功的 client
            var lastIdx = clients.indexOf(lastWorkingClient);
            if (lastIdx > 0) {
                clients.splice(lastIdx, 1);
                clients.unshift(lastWorkingClient);
            }

            var i = 0;
            function tryNext() {
                if (i >= clients.length) {
                    resolve(false);
                    return;
                }
                var url = buildGoogleUrl(text, voice.lang || 'ja', voice.speed || 1, clients[i]);
                var audio = globalAudio;
                audio.src = url;

                var timer = setTimeout(function() {
                    audio.oncanplaythrough = null;
                    audio.onerror = null;
                    i++;
                    tryNext();
                }, 6000);

                audio.oncanplaythrough = function() {
                    clearTimeout(timer);
                    audio.oncanplaythrough = null;
                    lastWorkingClient = clients[i];
                    var p = audio.play();
                    if (p && p.then) {
                        p.then(function() { resolve(true); })
                         .catch(function() { i++; tryNext(); });
                    } else {
                        resolve(true);
                    }
                };

                audio.onerror = function() {
                    clearTimeout(timer);
                    audio.oncanplaythrough = null;
                    i++;
                    tryNext();
                };

                audio.load();
            }

            tryNext();
        });
    }

    // ========== 本地 Web Speech API ==========
    function playLocal(text, voice) {
        return new Promise(function(resolve) {
            if (!window.speechSynthesis) { resolve(false); return; }
            speechSynthesis.cancel();

            var utter = new SpeechSynthesisUtterance(text);
            utter.lang = voice.lang || 'ja-JP';
            utter.rate = voice.speed || 0.8;

            // 如果是 system voice（从系统检测到的）
            if (voice.type === 'system' && voice.voiceObj) {
                utter.voice = voice.voiceObj;
            } else {
                // 尝试找日语语音
                var voices = speechSynthesis.getVoices();
                var found = null;
                for (var j = 0; j < voices.length; j++) {
                    if (voices[j].lang && voices[j].lang.indexOf('ja') === 0) {
                        if (voice.preferMale && voices[j].name.toLowerCase().match(/male|otoya|男/)) {
                            found = voices[j];
                            break;
                        }
                        if (!found) found = voices[j];
                    }
                }
                if (found) utter.voice = found;
            }

            utter.onend = function() { resolve(true); };
            utter.onerror = function() { resolve(false); };
            speechSynthesis.speak(utter);

            // 超时兜底
            setTimeout(function() { resolve(true); }, 8000);
        });
    }

    // ========== 核心播放 ==========
    function speakJapanese(text) {
        if (!text || !text.trim()) return Promise.resolve();
        text = text.trim();
        stopCurrent();

        var voice = getCurrentVoice();

        if (voice.type === 'online') {
            return playOnline(text, voice).then(function(ok) {
                if (!ok) return playLocal(text, voice);
            });
        } else {
            // local / system 语音
            return playLocal(text, voice).then(function(ok) {
                if (!ok) return playOnline(text, { lang: 'ja', speed: 1 });
            });
        }
    }

    function stopCurrent() {
        globalAudio.pause();
        try { globalAudio.currentTime = 0; } catch(e) {}
        globalAudio.oncanplaythrough = null;
        globalAudio.onended = null;
        globalAudio.onerror = null;
        if (window.speechSynthesis) speechSynthesis.cancel();
        if (currentPlayingEl) {
            currentPlayingEl.classList.remove('playing');
            currentPlayingEl = null;
        }
    }

    // ========== 播放 + 视觉反馈 ==========
    function playAndHighlight(element, text) {
        if (currentPlayingEl) {
            currentPlayingEl.classList.remove('playing');
        }

        element.classList.add('playing');
        currentPlayingEl = element;

        speakJapanese(text).then(function() {
            element.classList.remove('playing');
            if (currentPlayingEl === element) currentPlayingEl = null;
        });

        globalAudio.onended = function() {
            element.classList.remove('playing');
            if (currentPlayingEl === element) currentPlayingEl = null;
        };

        setTimeout(function() {
            element.classList.remove('playing');
        }, 6000);
    }

    // 全局函数
    window.playJapanese = function(text) {
        speakJapanese(text);
    };

    // ========== 绑定点击事件 ==========

    document.querySelectorAll('.speech-text, .kana').forEach(function(el) {
        el.addEventListener('click', function(e) {
            if (e.target.classList.contains('audio-button')) return;
            var text = this.textContent.replace(/🔊/g, '').trim();
            if (text) playAndHighlight(this, text);
        });
    });

    document.querySelectorAll('.word-text').forEach(function(el) {
        el.addEventListener('click', function() {
            var text = this.textContent.replace(/🔊/g, '').trim();
            if (text) playAndHighlight(this, text);
        });
    });

    document.querySelectorAll('.vocabulary table td:nth-child(2)').forEach(function(el) {
        el.classList.add('kana-cell');
        el.style.cursor = 'pointer';
        el.addEventListener('click', function() {
            var text = this.textContent.trim();
            if (text) playAndHighlight(this, text);
        });
    });

    document.querySelectorAll('.audio-button').forEach(function(btn) {
        btn.removeAttribute('onclick');
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            e.preventDefault();
            var text = this.getAttribute('data-text');
            if (!text) {
                var parent = this.closest('.speech-text, .japanese');
                if (parent) text = parent.textContent.replace(/🔊/g, '').trim();
            }
            if (text) {
                var self = this;
                self.classList.add('playing');
                speakJapanese(text).then(function() {
                    self.classList.remove('playing');
                });
                setTimeout(function() { self.classList.remove('playing'); }, 6000);
            }
        });
    });

    document.querySelectorAll('.listening-script').forEach(function(el) {
        el.addEventListener('click', function() {
            var text = this.textContent.replace(/🔊/g, '').trim();
            if (text) playAndHighlight(this, text);
        });
    });

    // ========== 内容导航 ==========
    var navSection = document.createElement('section');
    navSection.className = 'navigation';

    var navHeader = document.createElement('h3');
    navHeader.textContent = '内容导航';
    navSection.appendChild(navHeader);

    var navLinks = document.createElement('div');
    navLinks.className = 'nav-links';

    [
        { cls: 'dialogue', text: '对话' },
        { cls: 'vocabulary', text: '单词' },
        { cls: 'grammar-points', text: '语法' },
        { cls: 'example-sentences', text: '例句' },
        { cls: 'exam-practice', text: 'N5真题' }
    ].forEach(function(sec) {
        var target = document.querySelector('.' + sec.cls);
        if (!target) return;
        var link = document.createElement('a');
        link.href = '#';
        link.textContent = sec.text;
        link.addEventListener('click', function(e) {
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth' });
        });
        navLinks.appendChild(link);
    });

    navSection.appendChild(navLinks);
    var dialogueEl = document.querySelector('.dialogue');
    if (dialogueEl) {
        document.querySelector('.container').insertBefore(navSection, dialogueEl);
    }

    // ========== 答案切换 ==========
    document.querySelectorAll('.toggle-answer').forEach(function(button) {
        button.addEventListener('click', function() {
            var answerSection = this.nextElementSibling;
            if (answerSection.style.display === 'none' || !answerSection.style.display) {
                answerSection.style.display = 'block';
                this.textContent = '隐藏答案';
                this.classList.add('active');
            } else {
                answerSection.style.display = 'none';
                this.textContent = '显示答案';
                this.classList.remove('active');
            }
        });
    });

    document.querySelectorAll('.answer-section').forEach(function(section) {
        section.style.display = 'none';
    });

    // ========== 手机端首次触摸激活音频 ==========
    function activateAudio() {
        try {
            var s = new Audio();
            s.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';
            s.play().catch(function(){});
        } catch(e) {}
        document.removeEventListener('touchstart', activateAudio);
        document.removeEventListener('click', activateAudio);
    }
    document.addEventListener('touchstart', activateAudio, { once: true });
    document.addEventListener('click', activateAudio, { once: true });

    // ========== Web Speech API 预加载 ==========
    if (window.speechSynthesis) {
        speechSynthesis.getVoices();
    }

    // ========== 初始化语音栏 ==========
    injectVoiceBarStyles();
    createVoiceBar();
});
