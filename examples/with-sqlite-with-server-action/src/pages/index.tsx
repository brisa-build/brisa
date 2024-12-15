import type { RequestContext } from 'brisa';
import { renderPage } from 'brisa/server';
import { Database } from 'bun:sqlite';

type Movie = {
  title: string;
  year: number;
};

const db = createDB();
const query = db.query<Movie, Movie[]>('SELECT title, year FROM movies');
const insertMovieQuery = db.query(
  'INSERT INTO movies (title, year) VALUES ($title, $year)',
);

// More info about SQLite: https://bun.sh/docs/api/sqlite
export default function Homepage({}, { css, indicate }: RequestContext) {
  const pending = indicate('insertMovieQuery');
  const movies = query.all();

  async function addMoviesServerAction(e: FormDataEvent) {
    const $title = e.formData.get('title') as string;
    const $year = Number(e.formData.get('year'));

    (e.target as HTMLFormElement).reset();
    insertMovieQuery.run({ $title, $year });
    renderPage();
  }

  // Disabling button via CSS during the request
  css`
    button.brisa-request {
      opacity: 0.5;
      cursor: wait;
      pointer-events: none;
    }
  `;

  return (
    <>
      <div class="hero">
        <h1>
          <span class="h1_addition">SQLite </span>Example
        </h1>
        <p class="edit-note">✏️ Change the queries on </p>
        <code>src/pages/index.tsx</code>
      </div>

      <section class="example-section">
        <div>
          <h2>Movies</h2>
          {movies.length === 0 && <p>No movies found</p>}
          <ul>
            {movies.map((movie) => (
              <li>
                {movie.title} ({movie.year})
              </li>
            ))}
          </ul>
        </div>
        <form onSubmit={addMoviesServerAction} indicateSubmit={pending}>
          <h2>Insert a Movie</h2>
          <input name="title" type="text" placeholder="Title"></input>
          <input name="year" type="number" placeholder="Year"></input>
          <button indicator={pending}>Add movies into the DB</button>
        </form>
      </section>
    </>
  );
}

function createDB() {
  const db = new Database('mydb.sqlite');
  db.exec(`
    CREATE TABLE IF NOT EXISTS movies (
      title TEXT,
      year INTEGER
    );
  `);
  return db;
}
