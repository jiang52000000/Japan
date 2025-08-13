document.addEventListener('DOMContentLoaded', function() {
    // 使用Web Speech API来实现日语朗读
    const synth = window.speechSynthesis;
    
    // 选择日语语音
    function getJapaneseVoice() {
        const voices = synth.getVoices();
        // 尝试找到日语语音
        return voices.find(voice => voice.lang === 'ja-JP') || voices[0];
    }
    
    // 确保语音列表已加载
    let japaneseVoice;
    if (synth.getVoices().length > 0) {
        japaneseVoice = getJapaneseVoice();
    } else {
        speechSynthesis.addEventListener('voiceschanged', function() {
            japaneseVoice = getJapaneseVoice();
        });
    }
    
    // 朗读日语文本
    function speakJapanese(text) {
        // 停止任何正在进行的朗读
        synth.cancel();
        
        // 创建新的语音实例
        const utterance = new SpeechSynthesisUtterance(text);
        
        // 设置为日语
        utterance.lang = 'ja-JP';
        
        // 如果找到了日语语音，使用它
        if (japaneseVoice) {
            utterance.voice = japaneseVoice;
        }
        
        // 设置其他参数
        utterance.pitch = 1;
        utterance.rate = 0.5; // 稍微放慢速度，便于学习
        utterance.volume = 1;
        
        // 开始朗读
        synth.speak(utterance);
        
        console.log(`朗读: ${text}`);
        return utterance;
    }
    
    // 添加点击事件监听器到日语文本元素
    document.querySelectorAll('.speech-text, .kana').forEach(element => {
        element.addEventListener('click', function() {
            // 获取实际的日语文本内容
            const japaneseText = this.textContent;
            speakJapanese(japaneseText);
            
            // 添加视觉反馈
            this.classList.add('playing');
            setTimeout(() => {
                this.classList.remove('playing');
            }, 1500);
        });
    });
    
    // 添加点击事件监听器到词汇单词
    document.querySelectorAll('.word-text').forEach(element => {
        element.addEventListener('click', function() {
            // 获取实际的日语单词内容
            const japaneseWord = this.textContent;
            speakJapanese(japaneseWord);
            
            // 添加视觉反馈
            this.classList.add('playing');
            setTimeout(() => {
                this.classList.remove('playing');
            }, 1000);
        });
    });

    // 将单词表中的假名td元素也设置为可点击朗读
    document.querySelectorAll('.vocabulary table td:nth-child(2)').forEach(element => {
        element.classList.add('kana-cell');
        element.style.cursor = 'pointer';
        
        element.addEventListener('click', function() {
            const kanaText = this.textContent;
            speakJapanese(kanaText);
            
            this.classList.add('playing');
            setTimeout(() => {
                this.classList.remove('playing');
            }, 1000);
        });
    });

    // 添加一个导航功能，让用户可以快速跳转到不同部分
    const navSection = document.createElement('section');
    navSection.className = 'navigation';
    
    const navHeader = document.createElement('h3');
    navHeader.textContent = '内容导航';
    navSection.appendChild(navHeader);
    
    const navLinks = document.createElement('div');
    navLinks.className = 'nav-links';
    
    const sections = [
        { id: 'dialogue', text: '对话' },
        { id: 'vocabulary', text: '单词' },
        { id: 'grammar-points', text: '语法' },
        { id: 'example-sentences', text: '例句' },
        { id: 'exam-practice', text: 'N5真题' }
    ];
    
    sections.forEach(section => {
        const link = document.createElement('a');
        link.href = `#${section.id}`;
        link.textContent = section.text;
        link.addEventListener('click', function(e) {
            e.preventDefault();
            document.querySelector(`.${section.id}`).scrollIntoView({ 
                behavior: 'smooth' 
            });
        });
        navLinks.appendChild(link);
    });
    
    navSection.appendChild(navLinks);
    document.querySelector('.container').insertBefore(navSection, document.querySelector('.dialogue'));
    
    // 为了支持所有浏览器，我们添加一个回退方案
    // 如果Web Speech API不可用，我们会显示一个消息
    if (!('speechSynthesis' in window)) {
        const warning = document.createElement('div');
        warning.className = 'speech-warning';
        warning.textContent = '提示：您的浏览器不支持语音合成功能，请使用Chrome、Edge或Safari浏览器以获得最佳体验。';
        document.querySelector('.container').prepend(warning);
        
        const warningStyle = document.createElement('style');
        warningStyle.textContent = `
            .speech-warning {
                background-color: #fff3cd;
                color: #856404;
                padding: 10px;
                margin-bottom: 20px;
                border-radius: 5px;
                text-align: center;
            }
        `;
        document.head.appendChild(warningStyle);
    }
    
    // 添加控制显示/隐藏答案的功能
    document.querySelectorAll('.toggle-answer').forEach(button => {
        button.addEventListener('click', function() {
            const answerSection = this.nextElementSibling;
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

    // 初始化所有答案为隐藏状态
    document.querySelectorAll('.answer-section').forEach(section => {
        section.style.display = 'none';
    });
});
