
// Função para filtrar livros
function filterBooks(books, searchTerm) {
    if (!searchTerm) return books;
    
    searchTerm = searchTerm.toLowerCase();
    return books.filter(book => 
        book.title?.toLowerCase().includes(searchTerm) ||
        book.author?.toLowerCase().includes(searchTerm)
    );
}

// Função para renderizar a lista de livros
function renderBooks(books, container) {
    if (!books || books.length === 0) {
        container.innerHTML = '<li>Nenhum livro encontrado.</li>';
        document.getElementById('noResults').style.display = 'block';
        return;
    }

    document.getElementById('noResults').style.display = 'none';
    container.innerHTML = '';

    books.forEach((book) => {
        const li = document.createElement('li');
        li.className = 'book-item';

        const img = document.createElement('img');
        img.src = book.cover && book.cover.fileId ? 
            `/api/audio/${book.cover.fileId}` : 
            'https://via.placeholder.com/150x200?text=Sem+Capa';
        img.alt = book.title || 'Livro sem título';
        img.className = `book-cover img-link-${book._id}`;

        const title = document.createElement('h3');
        title.textContent = book.title || 'Sem título';
        title.className = 'book-title';

        const author = document.createElement('p');
        author.textContent = book.author || 'Autor desconhecido';
        author.className = 'book-author';

        li.appendChild(img);
        li.appendChild(title);
        li.appendChild(author);

        li.addEventListener('click', () => {
            try {
                sessionStorage.setItem('selectedBook', JSON.stringify(book));
            } catch (e) {
                console.warn('Não foi possível salvar no sessionStorage', e);
            }
            window.location.href = `/player.html?id=${book._id}`;
        });

        container.appendChild(li);
    });
}

let allBooks = []; // Variável para armazenar todos os livros

document.addEventListener('DOMContentLoaded', async () => {
    // Obtém o container da lista no index1.html
    const list = document.getElementById('book-list') || document.querySelector('.album ul');
    if (!list) return;

    // Configura o evento de pesquisa
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');

    const handleSearch = () => {
        const searchTerm = searchInput.value.trim();
        const filteredBooks = filterBooks(allBooks, searchTerm);
        renderBooks(filteredBooks, list);
    };

    searchInput.addEventListener('input', handleSearch);
    searchButton.addEventListener('click', handleSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });

    try {
        // Carrega livros da API
        const response = await fetch('/api/books');
        if (!response.ok) throw new Error('Erro ao carregar livros');
        allBooks = await response.json();
        renderBooks(allBooks, list);
    } catch (err) {
        console.error('Erro ao carregar livros:', err);
        list.innerHTML = '<li>Erro ao carregar livros. Tente novamente.</li>';
    }
});

