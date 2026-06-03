# 📂 Categorias Disponíveis

Aqui estão todas as categorias disponíveis no frontend para criar/filtrar grupos:

## 🔧 Tecnologia & Desenvolvimento
- **Tecnologia** (cat-tech) - Discussões sobre tecnologia, inovação e tendências
- **Desenvolvimento** (cat-dev) - Programação, web, mobile, backend, frontend
- **Inteligência Artificial** (cat-ai) - IA, Machine Learning, Deep Learning, ChatGPT
- **Cibersegurança** (cat-cybersec) - Segurança, hacking ético, proteção de dados

## 💼 Negócios & Finanças
- **Finanças** (cat-finance) - Investimentos, criptomoedas, bolsa de valores
- **Criptomoedas** (cat-crypto) - Bitcoin, Ethereum, blockchain, NFT, Web3
- **Negócios** (cat-business) - Empreendedorismo, startups, marketing, vendas
- **Vendas** (cat-sales) - Técnicas de venda, prospecção, CRM
- **Marketing** (cat-marketing) - Digital marketing, redes sociais, estratégia

## 📚 Educação & Carreira
- **Educação** (cat-education) - Cursos, aprendizado, formação profissional
- **Idiomas** (cat-languages) - Aprenda inglês, espanhol, francês e outros
- **Carreira** (cat-career) - Desenvolvimento profissional, networking, jobs
- **Coaching** (cat-coaching) - Desenvolvimento pessoal, produtividade, mindset

## 🎯 Lifestyle & Hobbies
- **Fitness & Saúde** (cat-fitness) - Exercícios, nutrição, bem-estar, academia
- **Esportes** (cat-sports) - Futebol, tênis, corrida, musculação, yoga
- **Jogos** (cat-gaming) - Videogames, e-sports, PC gamer, console
- **Viagens** (cat-travel) - Turismo, destinos, dicas de viagem
- **Gastronomia** (cat-cooking) - Receitas, culinária, restaurantes, comida
- **Música** (cat-music) - Música, artistas, shows, produção musical
- **Cinema & Séries** (cat-movies) - Filmes, séries, streaming, reviews
- **Livros** (cat-books) - Leitura, literatura, resenhas, autores

## 👥 Comunidade & Social
- **Local & Comunidade** (cat-local) - Grupos locais, eventos, vizinhança
- **Pais & Filhos** (cat-parents) - Maternidade, paternidade, educação infantil
- **Pets & Animais** (cat-pets) - Cães, gatos, criação de animais, veterinária
- **Carros & Motos** (cat-cars) - Automóveis, motos, mecânica, tuning
- **Casa & Decoração** (cat-home) - Decoração, móveis, reforma, DIY

## 🎨 Criatividade & Artes
- **Design & Artes** (cat-design) - Design gráfico, UX/UI, artes plásticas
- **Fotografia** (cat-photo) - Fotografia, edição, câmeras, técnicas
- **Vídeo & Audiovisual** (cat-video) - Produção de vídeo, editing, criação
- **Moda & Estilo** (cat-fashion) - Roupas, tendências, styling, beleza

## 📌 Outros
- **Diversos** (cat-misc) - Tópicos variados e gerais

---

## 📊 Total: 34 Categorias

Todas as categorias estão organizadas em 7 grupos principais para melhor experiência do usuário.

## 🔗 Integração no Backend

Para usar essas categorias no backend, você pode:

1. **Copiar os IDs** (cat-tech, cat-dev, etc.) para usar em validações
2. **Sincronizar a lista** com o banco de dados
3. **Usar os mesmos nomes** para manter consistência entre frontend e backend

## 💡 Para Adicionar Novas Categorias

Edite o arquivo `src/api/categoriesApi.js` e adicione à array `MOCK_CATEGORIES`:

```javascript
{ id: "cat-nova", name: "Nova Categoria", description: "Descrição..." }
```

Depois atualize o método `getCategoriesByType()` para agrupar corretamente.
