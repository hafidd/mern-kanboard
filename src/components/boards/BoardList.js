import React from "react";

export default function ({ boards, history }) {
  const Board = ({ board }) => (
    <li
      onClick={() => {
        history.push(`/board/${board._id}`);
      }}
    >
      <h4>{board.name}</h4>
      <hr />
      <p>{board.desc}</p>
    </li>
  );

  const Boards = () =>
    boards.map((board) => <Board key={board._id} board={board} />);

  return (
    <ul className="boards">
      <Boards />
    </ul>
  );
}
