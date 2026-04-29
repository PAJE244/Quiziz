(function() {
if (window.quizizz_ai_loaded) return;
window.quizizz_ai_loaded = true;

const PUTER_URL = "https://js.puter.com/v2/";  
  
const loadPuter = () => new Promise(res => {  
    if (window.puter) return res();  
    const s = document.createElement('script');  
    s.src = PUTER_URL;  
    s.onload = res;  
    document.head.appendChild(s);  
});  

async function init() {  
    await loadPuter();  
    createUI();  
}  

function createUI() {  
    const container = document.createElement('div');  
    container.id = 'q-ai-container';  
    Object.assign(container.style, {  
        position: 'fixed', top: '100px', left: '100px', zIndex: '9999999',  
        userSelect: 'none', fontFamily: '"Segoe UI", Roboto, Helvetica, Arial, sans-serif'  
    });  

    const ball = document.createElement('div');  
    ball.innerHTML = '✨';  
    Object.assign(ball.style, {  
        width: '50px', height: '50px', background: 'linear-gradient(135deg, #a78bfa, #8b5cf6)',  
        borderRadius: '50%', display: 'none', alignItems: 'center', justifyContent: 'center',  
        fontSize: '24px', cursor: 'grab', boxShadow: '0 4px 15px rgba(0,0,0,0.3)',  
        transition: 'transform 0.2s'  
    });  

    const panel = document.createElement('div');  
    Object.assign(panel.style, {  
        width: '220px', background: '#1e1e1e', borderRadius: '15px',  
        border: '2px solid #a78bfa', padding: '15px', color: 'white',  
        display: 'flex', flexDirection: 'column', gap: '10px',  
        boxShadow: '0 10px 30px rgba(0,0,0,0.5)', position: 'relative'
    });  

    const header = document.createElement('div');  
    header.innerHTML = `
        <b style="color:#a78bfa">Quizizz IA</b> 
        <div style="float:right; display:flex; gap:8px;">
            <span style="cursor:pointer;opacity:0.7" id="q-min" title="Minimizar">➖</span>
            <span style="cursor:pointer;opacity:0.7; font-weight:bold;" id="q-close" title="Fechar">✖</span>
        </div>
    `;  
    header.style.cursor = 'grab';  
    header.style.paddingBottom = '8px';  
    header.style.borderBottom = '1px solid #333';  
    panel.appendChild(header);  

    const loginBtn = document.createElement('button');  
    const updateLoginStatus = () => {  
        const signed = window.puter.auth.isSignedIn();  
        loginBtn.innerText = signed ? '✅ Logado' : '🔑 Login Google';  
        loginBtn.style.background = signed ? '#34A853' : '#4285F4';  
    };  
    Object.assign(loginBtn.style, {  
        border: 'none', borderRadius: '8px', padding: '10px', color: 'white',   
        cursor: 'pointer', fontWeight: '500', transition: 'opacity 0.2s'  
    });  
    loginBtn.onclick = async () => {  
        try { await window.puter.auth.signIn(); updateLoginStatus(); } catch(e) {}  
    };  
    panel.appendChild(loginBtn);  

    const solveBtn = document.createElement('button');  
    solveBtn.innerText = '✨ Resolver Questão';  
    Object.assign(solveBtn.style, {  
        background: 'linear-gradient(135deg, #a78bfa, #8b5cf6)',  
        border: 'none', borderRadius: '8px', padding: '12px', color: 'white',  
        cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 10px rgba(139, 92, 246, 0.3)'  
    });  
    solveBtn.onclick = async () => {  
        solveBtn.disabled = true;  
        solveBtn.innerText = '⌛ Analisando...';  
        try {  
            await solve();  
            solveBtn.innerText = '✅ Resolvido!';  
        } catch (e) {  
            solveBtn.innerText = '❌ Erro';  
            console.error(e);  
        }  
        setTimeout(() => { solveBtn.disabled = false; solveBtn.innerText = '✨ Resolver Questão'; }, 2000);  
    };  
    panel.appendChild(solveBtn);  

    const footer = document.createElement('div');
    footer.innerHTML = '<small style="opacity:0.5; text-align:center; display:block;">Feito por Pajé_01</small>';
    panel.appendChild(footer);

    container.appendChild(ball);  
    container.appendChild(panel);  
    document.body.appendChild(container);  

    let isDragging = false, startX, startY;  
    const onMouseDown = (e) => {  
        if (e.target.id === 'q-min' || e.target.id === 'q-close') return;  
        isDragging = true;  
        startX = e.clientX - container.offsetLeft;  
        startY = e.clientY - container.offsetTop;  
        if (e.currentTarget === ball) ball.style.cursor = 'grabbing';
        else header.style.cursor = 'grabbing';
    };  
    const onMouseMove = (e) => {  
        if (!isDragging) return;  
        container.style.left = (e.clientX - startX) + 'px';  
        container.style.top = (e.clientY - startY) + 'px';  
    };  
    const onMouseUp = () => { 
        isDragging = false; 
        ball.style.cursor = 'grab';
        header.style.cursor = 'grab';
    };  
      
    [ball, header].forEach(el => el.addEventListener('mousedown', onMouseDown));  
    document.addEventListener('mousemove', onMouseMove);  
    document.addEventListener('mouseup', onMouseUp);  

    header.querySelector('#q-min').onclick = () => {  
        panel.style.display = 'none';  
        ball.style.display = 'flex';  
    };  
    header.querySelector('#q-close').onclick = () => {  
        container.remove();
        window.quizizz_ai_loaded = false;
    };
    ball.ondblclick = () => {  
        ball.style.display = 'none';  
        panel.style.display = 'flex';  
    };  

    updateLoginStatus();  
}  

async function solve() {  
    const q = document.querySelector('#questionText')?.innerText;  
    const opts = Array.from(document.querySelectorAll('.option')).map(el => ({  
        text: el.innerText.trim(), el: el  
    }));  
    if (!q || opts.length === 0) throw 'Questão não detectada';  

    const prompt = `Questão: ${q}\nOpções:\n${opts.map((o,i)=>`${i+1}. ${o.text}`).join('\n')}\nResponda apenas com o texto exato da opção correta.`;  
    const res = await window.puter.ai.chat(prompt, { model: 'gemini-2.5-flash-lite' });  
    const ans = res.toString().toLowerCase().trim();  

    opts.forEach(o => {  
        const optText = o.text.toLowerCase();  
        if (optText.includes(ans) || ans.includes(optText)) {  
            o.el.style.border = '5px solid #00FF00';  
            o.el.style.boxShadow = '0 0 20px #00FF00';  
            o.el.scrollIntoView({ behavior: 'smooth', block: 'center' });  
        }  
    });  
}  

init();  

})();

