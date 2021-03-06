import React, { useState, useEffect } from "react";
import { useHistory } from "react-router-dom";

import * as boardApi from "../api/board";

import useUser from "../context/hooks/useUser";

import Modal from "./Modal";
import ErrMsg from "./ErrMsg";

export default function () {
  const [boards, setBoards] = useState([]);
  const [err, setErr] = useState(null);
  const [modal, setModal] = useState(false);

  const history = useHistory();

  const { user } = useUser();

  useEffect(() => {
    if (!user._id) return;
    boardApi
      .loadBoards()
      .then((res) => setBoards(res.data))
      .catch((error) => setErr(error.response && error.response.data));
  }, [user._id]);

  return (
    <div>
      <h3>My Boards</h3>
      <button onClick={() => setModal(!modal)}>+ New Board</button>
      <ErrMsg error={err} />
      <ul className="boards">
        {boards.map((board) => (
          <li
            key={board._id}
            onClick={() => {
              history.push(`/board/${board._id}`);
            }}
          >
            <p>{board.name}</p>
            <p>{board.desc}</p>
          </li>
        ))}
      </ul>
      <Modal title="New Board" visible={modal} setVisible={setModal}>
        <NewBoard setModal={setModal} setBoards={setBoards} />
      </Modal>
    </div>
  );
}

function NewBoard({ setModal, setBoards }) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [err, setErr] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      const { data } = await boardApi.addBoard({ name, desc });
      setBoards((prevBoards) => [{ _id: data._id, name, desc }, ...prevBoards]);
      setModal(false);
    } catch (error) {
      if (error.response) setErr(error.response.data);
    }
  };

  return (
    <div>
      <ErrMsg error={err} />
      <form onSubmit={(e) => submit(e)}>
        <div className="mb1">
          <input
            className="fw"
            value={name}
            onChange={(e) => setName(e.target.value)}
            type="text"
            placeholder="Board name"
          />
        </div>
        <div className="mb1">
          <textarea
            placeholder="description"
            className="fw"
            rows="5"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
          ></textarea>
        </div>
        <div className="mb1">
          <button className="fw">SUBMIT</button>
        </div>
      </form>
    </div>
  );
}
