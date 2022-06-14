import React, { useState } from "react";

export default function NewBoard({ setModal, setBoards, addBoard, ErrMsg }) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [err, setErr] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      const { data } = await addBoard({ name, desc });
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
