import { renderComponent } from 'brisa/server';

type Question = {
  answer: string;
  question: string;
  id: number;
};

// All this code is server-code. So is impossible that the user knows the answer
// after inspecting the page.
const questions: Question[] = [
  { id: 1, answer: 'no', question: 'Is the Earth flat? ' },
  { id: 2, answer: 'yes', question: 'Is the Earth round? ' },
  { id: 3, answer: 'no', question: 'Can giraffes lay eggs?' },
  { id: 4, answer: 'yes', question: 'Can penguins fly?' },
  { id: 5, answer: 'no', question: 'Can a cow jump over the moon?' },
  { id: 6, answer: 'yes', question: 'Is water wet by definition?' },
  { id: 7, answer: 'yes', question: 'Is the sky blue?' },
  { id: 8, answer: 'yes', question: 'Do fish sleep with their eyes open?' },
  { id: 9, answer: 'no', question: 'Can a cow fly?' },
];

function openModal() {
  const randomIndex = Math.floor(Math.random() * questions.length);
  renderComponent({
    element: <Modal {...questions[randomIndex]} />,
    target: '#content',
  });
}

function processAnswer(e: MouseEvent, value = 'yes') {
  const id = (e.target as HTMLButtonElement).dataset.id;
  const isCorrect =
    questions.find((q) => q.id === Number(id))?.answer === value;

  renderComponent({
    element: isCorrect ? (
      <p id="content" class="correct">
        Correct!
      </p>
    ) : (
      <p id="content" class="incorrect">
        Incorrect!
      </p>
    ),
    target: 'dialog',
  });
}

export default function Homepage() {
  return (
    <>
      <div class="hero">
        <h1>
          <span class="h1_addition">Welcome to </span>Brisa
        </h1>
        <p class="edit-note">✏️ SSR Modal example</p>
        <code>src/pages/index.tsx</code>
      </div>

      <form onSubmit={openModal}>
        <button>Open modal</button>
        <div id="content" />
      </form>
    </>
  );
}

function Modal({ question, answer, id }: Question) {
  return (
    <dialog open>
      <form method="dialog">
        <h2>{question}</h2>
        <button data-id={id} onClick={(e) => processAnswer(e, 'yes')}>
          Yes
        </button>
        <button data-id={id} onClick={(e) => processAnswer(e, 'no')}>
          No
        </button>
      </form>
    </dialog>
  );
}
