
document.addEventListener('DOMContentLoaded', () => {
    const p = document.querySelector('.paragrafo');
    const pratras = document.querySelector('#praTras');
    const play = document.querySelector('#play');
    const pause = document.querySelector('#pause');
    const praFrente = document.querySelector('#praFrente');
    const audio = document.querySelector('#audio');
    const imgCapa = document.querySelector('.img-capa');

    // Tenta ler selectedBook do sessionStorage (definido na página inicial) 
    let currentBook = null;
    const raw = sessionStorage.getItem('selectedBook');
    if (raw) {
        try {
            currentBook = JSON.parse(raw);
        } catch (e) {
            console.warn('selectedBook inválido no sessionStorage', e);
            currentBook = null;
        }
    }

    // Fallback: se não houver sessionStorage, tentar obter via books global e parâmetro ?book= na URL
    if (!currentBook) {
        const urlParams = new URLSearchParams(window.location.search);
        const bookId = urlParams.get('book');
        if (window.books && bookId && window.books[bookId]) {
            currentBook = window.books[bookId];
        }
    }

    let musicaAtual = 0;

    // Carrega detalhes do livro da API se tiver  id 
    if (currentBook && currentBook._id) {
        fetch(`/api/books/${currentBook._id}`)
            .then(res => res.json())
            .then(book => {
                currentBook = book;
                
                // Atualiza capa  (agora vem do GridFS)
                if (imgCapa) {
                    imgCapa.src = book.cover && book.cover.fileId ? 
                        `/api/audio/${book.cover.fileId}` : 
                        'https://via.placeholder.com/150x200?text=Sem+Capa';
                    imgCapa.alt = `Capa do livro ${book.title || ''}`;
                }

                // Configurar player com a playlist
                if (book.playlist && book.playlist.length > 0) {
                    musicaAtual = 0;
                    if (audio) {
                        // Carrega o primeiro áudio da playlist
                        audio.src = `/api/audio/${book.playlist[0].fileId}`;
                        // Atualiza texto com título do capítulo
                        if (p) p.textContent = book.playlist[0].title || 'Capítulo 1';

                        // Configura botões de navegação
                        if (pratras) pratras.style.display = 'none'; // primeiro capítulo
                        if (praFrente) praFrente.style.display = book.playlist.length > 1 ? 'inline-block' : 'none';
                    }

                    // Configura eventos de navegação
                    if (pratras) {
                        pratras.onclick = () => {
                            if (musicaAtual > 0) {
                                musicaAtual--;
                                audio.src = `/api/audio/${book.playlist[musicaAtual].fileId}`;
                                if (p) p.textContent = book.playlist[musicaAtual].title || `Capítulo ${musicaAtual + 1}`;
                                audio.play();
                                
                                // Atualiza visibilidade dos botões
                                pratras.style.display = musicaAtual > 0 ? 'inline-block' : 'none';
                                praFrente.style.display = musicaAtual < book.playlist.length - 1 ? 'inline-block' : 'none';
                            }
                        };
                    }

                    if (praFrente) {
                        praFrente.onclick = () => {
                            if (musicaAtual < book.playlist.length - 1) {
                                musicaAtual++;
                                audio.src = `/api/audio/${book.playlist[musicaAtual].fileId}`;
                                if (p) p.textContent = book.playlist[musicaAtual].title || `Capítulo ${musicaAtual + 1}`;
                                audio.play();
                                
                                // Atualiza visibilidade dos botões
                                pratras.style.display = 'inline-block';
                                praFrente.style.display = musicaAtual < book.playlist.length - 1 ? 'inline-block' : 'none';
                            }
                        };
                    }
                } else {
                    if (p) p.textContent = 'Este livro não tem áudios disponíveis.';
                    if (audio) audio.style.display = 'none';
                    if (play) play.style.display = 'none';
                    if (pause) pause.style.display = 'none';
                    if (praFrente) praFrente.style.display = 'none';
                    if (pratras) pratras.style.display = 'none';
                }
            })
            .catch(err => {
                console.error('Erro ao carregar livro:', err);
                if (p) p.textContent = 'Erro ao carregar livro. Tente novamente.';
            });
    } else {
        // Se não há livro, mostra mensagem e desabilita controles
        if (p) p.textContent = 'Nenhum livro selecionado. Volte à biblioteca.';
        if (document.querySelector('.button-voltar')) document.querySelector('.button-voltar').style.display = 'inline-block';
        if (play) play.style.display = 'none';
        if (pause) pause.style.display = 'none';
        if (praFrente) praFrente.style.pointerEvents = 'none';
        if (pratras) pratras.style.pointerEvents = 'none';
        return;
    }

    // Funções utilitárias para atualizar estado
    function updateUIPlaying(isPlaying) {
        if (play) play.style.display = isPlaying ? 'none' : 'inline-block';
        if (pause) pause.style.display = isPlaying ? 'inline-block' : 'none';
    }

    function loadChapter(index) {
        musicaAtual = index;
        if (!currentBook || !currentBook.playlist) return;
        const src = currentBook.playlist[index];
        if (audio && src) {
            audio.src = src;
            audio.load();
        }
    if (p) p.textContent = (currentBook.texts && currentBook.texts[index]) || '';
    }

    // Controles
    if (pause) {
        pause.addEventListener('click', () => {
            audio && audio.pause();
            updateUIPlaying(false);
        });
    }

    if (play) {
        play.addEventListener('click', () => {
            audio && audio.play();
            updateUIPlaying(true);
        });
    }

    if (praFrente) {
        praFrente.addEventListener('click', () => {
            const next = (musicaAtual + 1) % currentBook.playlist.length;
            loadChapter(next);
            audio && audio.play();
            updateUIPlaying(true);
        });
    }

    if (pratras) {
        pratras.addEventListener('click', () => {
            const prev = (musicaAtual - 1 + currentBook.playlist.length) % currentBook.playlist.length;
            loadChapter(prev);
            audio && audio.play();
            updateUIPlaying(true);
        });
    }

    // Avançar automaticamente
    if (audio) {
        audio.addEventListener('ended', () => {
            const next = musicaAtual + 1;
            if (next < currentBook.playlist.length) {
                loadChapter(next);
                audio.play();
            } else {
                // chegou ao fim
                loadChapter(0);
                updateUIPlaying(false);
            }
        });
    }
});


