import React, { useState, useEffect } from "react";
import { useHistory } from "react-router-dom";

import { loadBoards, addBoard } from "../../api/board";
import useUser from "../../context/hooks/useUser";
import { io } from "../../sio";

// components
import Modal from "../Modal";
import ErrMsg from "../ErrMsg";
import NewBoard from "./NewBoard";
import BoardList from "./BoardList";

export default React.memo(({ addToast }) => {
  const [boards, setBoards] = useState([]);
  const [err, setErr] = useState(null);
  const [modal, setModal] = useState(false);

  const history = useHistory();

  const { user, reloadBoardRoles } = useUser();

  // socketio events
  useEffect(() => {
    if (io) {
      io.on("add-member", async (data) => {
        addToast(`Ditambahkan menjadi member board "${data.name}"`);
        setBoards((prevBoards) => [data, ...prevBoards]);
        reloadBoardRoles();
      });
      io.on("new-roles", (data) => {
        reloadBoardRoles();
      });
      io.on("delete-board", (data) => {
        setBoards((prevBoards) => prevBoards.filter((b) => b._id !== data));
      });
      return () => {
        io.off("add-member");
        io.off("delete-board");
        io.off("new-roles");
      };
    }
  }, [addToast, reloadBoardRoles]);

  useEffect(() => {
    if (!user._id) return;
    getBoards();
  }, [user._id]);

  // get boards
  const getBoards = async () => {
    try {
      const { data } = await loadBoards();
      setBoards(data);
    } catch (error) {
      setErr(error.response && error.response.data);
    }
  };

  const Title = () => (
    <h3 style={{ color: "white", padding: "10px 5px" }}>
      My Boards{" "}
      <button className="btn1" onClick={() => setModal(!modal)}>
        + New Board
      </button>
    </h3>
  );

  return (
    <>
      <Title />
      <ErrMsg error={err} />
      <BoardList boards={boards} history={history} />
      <Modal title="New Board" visible={modal} setVisible={setModal}>
        <NewBoard
          setModal={setModal}
          setBoards={setBoards}
          addBoard={addBoard}
          ErrMsg={ErrMsg}
        />
      </Modal>
    </>
  );
});
