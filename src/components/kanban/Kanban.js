import React, { useEffect, useState, useCallback } from "react";
import { DragDropContext, Draggable, Droppable } from "react-beautiful-dnd";
import { useParams, useHistory } from "react-router-dom";

import { cloneDeep } from "lodash";
import { fontColor } from "../../helpers";

import useUser from "../../context/hooks/useUser";

import * as boardApi from "../../api/board";

import Modal from "../Modal";
import ItemDetail from "./ItemDetail";
import Log from "./Log";

import { io } from "../../sio";

export default React.memo(({ addToast }) => {
  const [board, setBoard] = useState({});
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(false);

  const [modal, setModal] = useState(false);
  const [modalTitle, setModalTitle] = useState(null);
  const [modalContent, setModalContent] = useState(null);

  const [selectedListId, setSelectedListId] = useState(null);
  const [selectedListName, setSelectedListName] = useState("");

  const [selectedItem, setSelectedItem] = useState(null);
  const [logs, setLogs] = useState([]);

  const [selectedMember, setSelectedMember] = useState(null);

  const [newItem, setNewItem] = useState({ open: false, name: "" });

  const [myRole, setMyRole] = useState("");

  const { id } = useParams(); // id board
  const history = useHistory();

  const { user, reloadBoardRoles } = useUser();

  // update (socketio)
  useEffect(() => {
    if (io) {
      const toastText = (log) => {
        return log.user._id !== user._id
          ? log.user.name + " " + getLogText({ dt: log })
          : "" + getLogText({ dt: log });
      };

      io.emit("join", id);
      io.on("new-list", (data) => {
        setLists((prevLists) => [...prevLists, data.newList]);
        setLogs((prevLogs) => [data.newLog, ...prevLogs]);
        addToast(toastText(data.newLog));
      });
      io.on("new-item", (data) => {
        //console.log("new-item", data);
        setLists((prevList) => {
          const newList = cloneDeep(prevList).map((ls) => {
            if (ls._id === data.newLog.list._id) ls.items.push(data.newItem);
            return ls;
          });
          return newList;
        });
        setLogs((prevLogs) => [data.newLog, ...prevLogs]);
        addToast(toastText(data.newLog));
      });
      io.on("reorder", (data) => {
        setLists((prevList) => reorder(prevList, data.data));
        setLogs((prevLogs) => [data.log, ...prevLogs]);
        console.log(data.log);
        addToast(toastText(data.log));
      });
      io.on("update-item", (data) => {
        //console.log("update-item", data);
        setLists((prevList) =>
          cloneDeep(prevList).map((list) => {
            if (list._id === data.log.list._id)
              list.items = list.items.map((item) => {
                if (item._id === data.log.item._id) {
                  if (data.log.action === "new-label")
                    item.labels.push(data.update);
                  else if (data.log.action === "delete-label")
                    item.labels = item.labels.filter(
                      (lb) => lb._id !== data.update._id
                    );
                  else if (data.log.action === "update-desc")
                    item.desc = data.update;
                  else if (data.log.action === "update-dd")
                    item.dd = data.update;
                  else if (data.log.action === "new-checklist")
                    item.checkList.push(data.update);
                  else if (data.log.action === "update-checklist")
                    item.checkList = item.checkList.map((cl) => {
                      if (cl._id === data.update._id)
                        cl.completed = data.update.completed;
                      return cl;
                    });
                  else if (data.log.action === "delete-checklist")
                    item.checkList = item.checkList.filter(
                      (cl) => cl._id !== data.update._id
                    );
                  else if (data.log.action === "update-members") {
                    if (data.update.checked)
                      item.members.push(data.update.user);
                    else
                      item.members = item.members.filter(
                        (mb) => mb._id !== data.update._id
                      );
                  }

                  setSelectedItem((prevItem) =>
                    prevItem !== null ? item : null
                  );
                }
                return item;
              });
            return list;
          })
        );
        setLogs((prevLogs) => [data.log, ...prevLogs]);
        addToast(toastText(data.log));
      });
      io.on("add-member", async (data) => {
        if (!data.newLog) return reloadBoardRoles();
        setBoard((prevBoard) => ({
          ...prevBoard,
          team: [...prevBoard.team, data.user],
        }));
        setLogs((prevLogs) => [data.newLog, ...prevLogs]);
        addToast(toastText(data.newLog));
      });
      io.on("delete-member", async (data) => {
        if (data.user._id.toString() === user._id.toString())
          return history.push("/");
        // update board& logs
        setBoard((prevBoard) => ({
          ...prevBoard,
          team: prevBoard.team.filter(
            (t) => t._id.toString() !== data.user._id.toString()
          ),
        }));
        setLogs((prevLogs) => [data.newLog, ...prevLogs]);
        addToast(toastText(data.newLog));
      });
      io.on("update-role", async (data) => {
        // update board & logs
        setBoard((prevBoard) => ({
          ...prevBoard,
          team: prevBoard.team.map((member) => ({
            ...member,
            role:
              member._id === data.update.user._id
                ? data.update.role
                : member.role,
          })),
        }));
        setLogs((prevLogs) => [data.log, ...prevLogs]);
        setSelectedMember((prevSelected) =>
          prevSelected !== null
            ? {
                ...prevSelected,
                role:
                  prevSelected._id === data.update.user._id
                    ? data.update.role
                    : prevSelected.role,
              }
            : null
        );
        addToast(toastText(data.log));
      });
      io.on("rename-board", async (data) => {
        setBoard((prevBoard) => ({ ...prevBoard, name: data.data }));
        setLogs((prevLogs) => [data.newLog, ...prevLogs]);
        addToast(toastText(data.newLog));
      });
      io.on("edit-board-desc", async (data) => {
        setBoard((prevBoard) => ({ ...prevBoard, desc: data.data }));
        setLogs((prevLogs) => [data.newLog, ...prevLogs]);
        addToast(toastText(data.newLog));
      });
      io.on("delete-item", (data) => {
        if (data.update.ok === 0) return false;
        setLists((prevLists) =>
          prevLists.map((l) => ({
            ...l,
            items:
              l._id === data.listId
                ? l.items.filter((i) => i._id !== data.itemId)
                : l.items,
          }))
        );
        closeModal();
        //setSelectedItem(null);
        setLogs((prevLogs) => [data.newLog, ...prevLogs]);
        addToast(toastText(data.newLog));
      });
      io.on("delete-list", (data) => {
        if (data.update.ok === 0) return false;
        setLists((prevLists) => prevLists.filter((l) => l._id !== data.listId));
        setLogs((prevLogs) => [data.newLog, ...prevLogs]);
        addToast(toastText(data.newLog));
      });

      io.on("delete-board", (data) => {
        if (id === data) history.push("/");
      });
      io.on("new-roles", () => reloadBoardRoles());
    }
    return () => {
      if (io) {
        console.log("io x<");
        [
          "new-item",
          "new-list",
          "reorder",
          "update-item",
          "delete-member",
          "update-role",
          "new-roles",
        ].forEach((t) => io.off(t));
        io.emit("leave", id);
      }
    };
  }, [io, history]);

  useEffect(() => {
    if (board.team) {
      const role = board.team.find((t) => t._id === user._id).role;
      if (role !== myRole) setMyRole(role);
    }
  }, [board.team]);

  const loadBoard = useCallback(async () => {
    setLoading(true);
    let boardLoaded = false;
    try {
      // load board detail
      const { data } = await boardApi.loadBoard(id);
      boardLoaded = true;
      setLists(data.lists);
      delete data.lists;
      setBoard({
        ...data,
        team: [{ ...data.user, role: "owner" }, ...data.team],
      });
      // load logs
      const logs = await boardApi.loadLogs(id);
      setLogs(logs.data);
      setLoading(false);
    } catch (error) {
      if (!boardLoaded) history.push("/");
    }
  }, [id, history]);

  useEffect(() => {
    user._id && loadBoard();
  }, [user._id, loadBoard]);

  useEffect(() => {
    // if (selectedListId && !modal) {
    //   setSelectedListId(null);
    //   setSelectedListName("");
    // }
  }, [lists, selectedListId, setSelectedListName, modal]);

  const reorder = (lists, { source, destination, type }, revert = false) => {
    if (revert) {
      [source, destination] = [destination, source];
    }
    if (type === "item") {
      const newLists = JSON.parse(JSON.stringify(lists));
      const [item] = newLists
        .find((l) => l._id === source.droppableId)
        .items.splice(source.index, 1);
      if (!item) return false;
      return newLists.map((l) => {
        if (l._id === destination.droppableId)
          l.items.splice(destination.index, 0, item);
        return l;
      });
    } else {
      const newLists = [...lists];
      const [item] = newLists.splice(source.index, 1);
      newLists.splice(destination.index, 0, item);
      return newLists;
    }
  };

  const onDragEnd = async (e) => {
    const { source, destination, type } = e;
    if (
      !destination ||
      (source.droppableId === destination.droppableId &&
        source.index === destination.index)
    )
      return false;
    // const newLists = reorder(lists, e);
    // setLists(newLists);
    try {
      setLoading(true);
      await boardApi.reorder({
        id,
        source,
        destination,
        type,
      });
      setLoading(false);
    } catch (err) {
      loadBoard(); // reload kalo gagal
    }
  };

  const updateItem = async (action, data) => {
    try {
      setLoading(true);
      await boardApi.updateItem({
        id,
        listId: selectedListId,
        itemId: selectedItem._id,
        itemName: selectedItem.name,
        action,
        data,
      });
      setLoading(false);
    } catch (error) {
      console.log(error);
    }
  };

  const submitNewItem = async (name = "") => {
    try {
      if (!name.trim()) return;
      setLoading(true);
      await boardApi.newItem({
        id,
        selectedList: selectedListId,
        selectedListName,
        name,
      });

      setNewItem({ open: false, name: "" });
      setSelectedListId(null);
      setLoading(false);
    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  };

  const updateBoard = async (action, data) => {
    try {
      await boardApi.updateBoard({
        action: action,
        id: board._id,
        data: data,
      });
    } catch (error) {
      console.log("update board error", error);
      loadBoard();
    }
  };

  const deleteItem = async (itemId) => {
    try {
      await boardApi.deleteItem({
        id,
        listId: selectedListId,
        itemId,
        listName: selectedListName,
        itemName: selectedItem.name,
      });
    } catch (error) {
      console.log(error);
    }
  };

  const formatDate = (d) =>
    `${d.getDate()} ${d.toLocaleString("id-ID", { month: "long" })} 
        ${d.getFullYear()} - 
        ${d.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })}`;

  const getLogText = ({ dt, item = selectedItem }) =>
    dt.action === "new-label"
      ? `menambah label '${dt.data}' 
          ${item === null ? `ke item "${dt.item.name}"` : ""}`
      : dt.action === "delete-label"
      ? `menghapus label '${dt.data}' 
          ${item === null ? `di item "${dt.item.name}"` : ""}`
      : dt.action === "update-desc"
      ? `mengubah deskripsi : '${dt.data.slice(0, 15)}' 
          ${dt.data.length > 15 ? "...." : ""}
          ${item === null ? `pada item "${dt.item.name}"` : ""}`
      : dt.action === "update-dd"
      ? `${dt.data === null ? "menghapus" : "mengubah"} tanggal 
          ${dt.data === null ? "" : `'${formatDate(new Date(dt.data))}'`} ${
          item === null ? `pada item "${dt.item.name}"` : ""
        }`
      : dt.action === "new-checklist"
      ? `menambah checklist '${dt.data}' 
          ${item === null ? `ke item "${dt.item.name}"` : ""}`
      : dt.action === "delete-checklist"
      ? `menghapus checklist '${dt.data}' 
          ${item === null ? `pada item "${dt.item.name}"` : ""}`
      : dt.action === "update-checklist"
      ? `mengubah checklist ${dt.data.completed ? "✓" : ""} 
          '${dt.data.name}'
          ${item === null ? `pada item "${dt.item.name}"` : ""}`
      : dt.action === "update-members"
      ? `${dt.data.checked ? "menambah" : "menghapus"} 
          member '${dt.data.name}' 
          ${item === null ? `pada item "${dt.item.name}"` : ""}`
      : dt.action === "new-board"
      ? `membuat board "${dt.data}"`
      : dt.action === "new-list"
      ? `membuat list "${dt.data}"`
      : dt.action === "new-item"
      ? `menambahkan item "${dt.data}" ke list "${dt.list.name}"`
      : dt.action === "reorder-item"
      ? `mengubah urutan item "${dt.item.name}" 
          ${dt.data.source.index + 1}
          → ${dt.data.destination.index + 1} 
          pada list "${dt.list.name}"`
      : dt.action === "reorder-list"
      ? `mengubah urutan list "${dt.list.name}" 
          ${dt.data.source.index + 1}
          → ${dt.data.destination.index + 1}`
      : dt.action === "move-item"
      ? `memindahkan item "${dt.item.name}"
          dari "${dt.sourceList.name}" 
          ke "${dt.destinationList.name}"`
      : dt.action === "new-boardMember"
      ? `menambahkan member "${dt.data.name}"`
      : dt.action === "delete-boardMember"
      ? `mengeluarkan member "${dt.data.name}"`
      : dt.action === "update-role"
      ? `mengubah role "${dt.data.user.name}" ${dt.data.user.role} → ${dt.data.role}`
      : dt.action === "delete-item"
      ? `menghapus item "${dt.item.name}" pada list "${dt.list.name}"`
      : dt.action === "delete-list"
      ? `menghapus list ${dt.list.name}`
      : dt.action === "rename-board"
      ? `mengubah nama board → "${dt.data}"`
      : dt.action === "edit-board-desc"
      ? `mengubah deskripsi board → "${dt.data}"`
      : "-";

  const deleteList = async (listId, listName) => {
    try {
      await boardApi.deleteList({
        id,
        listId,
        listName,
      });
    } catch (error) {
      console.log(error);
    }
  };

  const deleteBoard = async () => {
    try {
      await boardApi.deleteBoard({ id });
    } catch (error) {
      console.log(error);
    }
  };

  const showModal = (title = "", content, item = null) => {
    if (item) setSelectedItem(item);
    setModalTitle(title);
    setModalContent(content);
    setModal(true);
  };
  const closeModal = () => {
    setModalTitle("");
    setModalContent(null);
    setModal(false);

    setSelectedItem(null);
    setSelectedMember(null);
  };

  return (
    <div className="board">
      {/* MODAL, new list,item,item detail,member */}
      <Modal
        title={modalTitle}
        visible={modal}
        setVisible={setModal}
        closeModal={closeModal}
      >
        {modalContent === "list" ? (
          <NewList id={id} setLoading={setLoading} setModal={setModal} />
        ) : modalContent === "item" ? (
          <NewItem
            id={id}
            selectedList={selectedListId}
            selectedListName={selectedListName}
            setLoading={setLoading}
            setModal={setModal}
          />
        ) : modalContent === "detail" ? (
          <ItemDetail
            item={selectedItem}
            updateItem={updateItem}
            deleteItem={deleteItem}
            formatDate={formatDate}
            getLogText={getLogText}
            team={board.team}
            logs={logs.filter((l) => l.item && l.item._id === selectedItem._id)}
          />
        ) : modalContent === "member" ? (
          <Member
            id={id}
            board={board}
            setLoading={setLoading}
            setBoard={setBoard}
            setLogs={setLogs}
          />
        ) : modalContent === "member-detail" ? (
          <MemberSetting
            id={id}
            member={selectedMember}
            myRole={myRole}
            formatDate={formatDate}
            getLogText={getLogText}
            logs={logs.filter((log) => log.user._id === selectedMember._id)}
          />
        ) : modalContent === "log" ? (
          <Log logs={logs} formatDate={formatDate} getLogText={getLogText} />
        ) : modalContent === "settings" ? (
          <BoardSetting
            board={board}
            myRole={myRole}
            deleteBoard={deleteBoard}
          />
        ) : (
          "-"
        )}
      </Modal>

      {/* board name, members */}
      <div className="board-menu flex-wrap-1">
        <h3 style={{ color: "white" }} className="mr2">
          {board.name}
        </h3>
        <ul className="" style={{ display: "flex", flex: 1 }}>
          {board.team &&
            board.team.map((team) => (
              <li
                key={team._id}
                className="mr1 p1"
                style={{
                  background: "white",
                }}
                onClick={() => {
                  setSelectedMember(team);
                  showModal(team.name, "member-detail");
                }}
              >
                {team.name}{" "}
                {team._id !== board.user._id &&
                team._id !== user._id &&
                (myRole === "admin" || myRole === "owner") ? (
                  <button
                    className="btn2r"
                    onClick={() => {
                      if (
                        window.confirm(
                          `hapus (${team.name} - ${team.email}) dari board ${board.name}?`
                        )
                      )
                        updateBoard("delete-member", team);
                    }}
                  >
                    x
                  </button>
                ) : (
                  ""
                )}
              </li>
            ))}
          <li>
            {myRole === "admin" || myRole === "owner" ? (
              <button
                className="fh btn1"
                onClick={() => showModal("Add member", "member")}
              >
                +
              </button>
            ) : (
              ""
            )}
          </li>
        </ul>
        <button
          className="btn1 fh"
          onClick={() => showModal("Settings", "settings")}
        >
          ⚙
        </button>
        <button
          className="btn1 fh ml1"
          onClick={() => showModal("Activity log", "log")}
        >
          Activity
        </button>
      </div>

      <DragDropContext onDragEnd={(e) => onDragEnd(e)}>
        <Droppable type="list" direction="horizontal" droppableId={"content"}>
          {(provided, snapshot) => (
            <div
              className="board-content"
              {...provided.droppableProps}
              ref={provided.innerRef}
            >
              {lists.map((d, i) => (
                <Draggable
                  isDragDisabled={loading}
                  type="list"
                  key={d._id}
                  draggableId={d._id}
                  index={i}
                >
                  {(provided, snapshot) => (
                    <div
                      className={`board-list ${
                        snapshot.isDragging ? "dragging" : ""
                      }`}
                      {...provided.draggableProps}
                      ref={provided.innerRef}
                    >
                      <div
                        {...provided.dragHandleProps}
                        className="list-header"
                      >
                        <strong>{d.title}</strong>
                        <button
                          className="btn-a bg-red fr"
                          onClick={() => {
                            if (!window.confirm(`hapus list ${d.title}?`))
                              return false;
                            deleteList(d._id, d.title);
                          }}
                        >
                          <span style={{ color: "white" }}>x</span>
                        </button>
                      </div>
                      <Droppable type="item" droppableId={d._id}>
                        {(provided, snapshot) => (
                          <div
                            className="list-content"
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                          >
                            <ul>
                              {d.items.map((list, i) => (
                                <Draggable
                                  isDragDisabled={loading}
                                  type="item"
                                  key={list._id}
                                  draggableId={list._id}
                                  index={i}
                                >
                                  {(provided, snapshot) => (
                                    <li
                                      className={`item ${
                                        snapshot.isDragging ? "dragging" : ""
                                      }`}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                      ref={provided.innerRef}
                                      onClick={() => {
                                        setSelectedListId(d._id);
                                        setSelectedListName(d.title);
                                        showModal(list.name, "detail", list);
                                      }}
                                    >
                                      <Item
                                        list={list}
                                        {...provided.draggableProps}
                                      />
                                    </li>
                                  )}
                                </Draggable>
                              ))}
                              {newItem.open && selectedListId === d._id && (
                                <div className="mt2">
                                  <input
                                    type="text"
                                    className="fw"
                                    placeholder="enter card name..."
                                    defaultValue={newItem.name}
                                    onChange={(e) =>
                                      setNewItem({
                                        ...newItem,
                                        name: e.target.value,
                                      })
                                    }
                                  />
                                  <button
                                    className="btn2 bg-green"
                                    onClick={() => submitNewItem(newItem.name)}
                                  >
                                    Save
                                  </button>
                                  <button
                                    className="btn2 ml1"
                                    onClick={() => {
                                      setNewItem({ open: false });
                                      setSelectedListId(null);
                                    }}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              )}
                              {newItem.open && selectedListId === d._id ? (
                                ""
                              ) : (
                                <button
                                  className="btn-a fw"
                                  onClick={() => {
                                    setSelectedListId(d._id);
                                    setSelectedListName(d.title);
                                    //showModal("New Item", "item");
                                    setNewItem({ open: true });
                                  }}
                                >
                                  + New card
                                </button>
                              )}
                            </ul>
                          </div>
                        )}
                      </Droppable>
                    </div>
                  )}
                </Draggable>
              ))}
              <div className="board-list">
                <button
                  className="btn-a"
                  onClick={() => showModal("New List", "list")}
                >
                  + New list
                </button>
              </div>
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
});

function Item({ list }) {
  return (
    <React.Fragment>
      {/* name */}
      <p className="bold font10">{list.name}</p>
      {/* labels */}
      <div className="mt2">
        <ul className="flex-wrap-1">
          {list.labels &&
            list.labels.map((label, i) => (
              <li
                key={label._id + i}
                className="mr1 mb1 p1 font8 bold"
                style={{
                  borderRadius: "5%",
                  background: label.color || "white",
                  color: fontColor(label.color || "#fff"),
                }}
              >
                {label.name}
              </li>
            ))}
        </ul>
      </div>
      {/* checklist */}
      {list.checkList.length ? (
        <div className="mt2 font10">
          Checklist{" "}
          {list.checkList.reduce((ac, c) => (c.completed ? ac + 1 : ac), 0)}/
          {list.checkList.length}
        </div>
      ) : (
        ""
      )}
      {/* members */}
      {list.members.length ? (
        <div className="mt2 font10">
          <ul className="flex-wrap-1">
            {list.members.map((mm) => (
              <li key={mm._id}>
                <span role="img" aria-label="" className="font12">
                  {mm.gender === "m" ? "🧟‍♂️" : mm.gender === "f" ? "🧟‍♀️" : "👽"}
                </span>
                <span>{mm.name}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        ""
      )}
      {/* due date */}
      {list.dd && (
        <div className="font8 mt2">
          <span role="img" aria-label="">
            🕑
          </span>{" "}
          {new Date(list.dd).toLocaleString("id-ID")}
        </div>
      )}
    </React.Fragment>
  );
}

function NewList({ id, setLoading, setModal }) {
  const [title, setTitle] = useState("");

  const submitNewList = async () => {
    try {
      if (!title.trim()) return;
      setLoading(true);
      boardApi.newList({ id, title });
      setTitle("");
      setLoading(false);
      setModal(false);
    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  };

  return (
    <div>
      <form
        onClick={(e) => {
          e.preventDefault();
          submitNewList();
        }}
      >
        <div>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="fw"
            type="text"
            placeholder="List Name"
          />
        </div>
        <div>
          <button className="fw">Submit</button>
        </div>
      </form>
    </div>
  );
}

function NewItem({ selectedList, selectedListName, id, setLoading, setModal }) {
  const [name, setName] = useState("");

  const submitNewItem = async (i = 0) => {
    try {
      if (!name.trim()) return;
      setLoading(true);
      const { data } = await boardApi.newItem({
        id,
        selectedList,
        selectedListName,
        name,
      });

      setName("");
      setModal(false);
      setLoading(false);
    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  };

  return (
    <div>
      <form
        onClick={(e) => {
          e.preventDefault();
          submitNewItem();
        }}
      >
        <div>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="fw"
            type="text"
            placeholder="Item Name"
          />
        </div>
        <div>
          <button className="fw">Submit</button>
        </div>
      </form>
    </div>
  );
}

function Member({ id, board, setBoard, setLoading, setLogs }) {
  const [email, setEmail] = useState("");

  return (
    <ul>
      {board.team.map((member, i) => (
        <li key={i}>{member.name}</li>
      ))}
      <li>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (email.trim()) {
              setLoading(true);
              try {
                await boardApi.updateBoard({
                  action: "add-member",
                  id,
                  data: email,
                });
              } catch (error) {
                console.log(error);
              }
              setLoading(false);
            }
            setEmail("");
          }}
        >
          <div className="fw">
            <input
              className="fw"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <button className="fw">Add</button>
        </form>
      </li>
    </ul>
  );
}

function MemberSetting({ id, member, myRole, logs, formatDate, getLogText }) {
  const [role, setRole] = useState("");

  useEffect(() => {
    setRole(member.role);
  }, [member]);

  const updateRole = async () => {
    try {
      await boardApi.setBoardRole({ id, user: member, role });
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <>
      <h4>{member.email}</h4>
      <p>Role : {member.role}</p>
      {member.role !== "owner" && myRole === "owner" ? (
        <div>
          <ul>
            <li>
              <input
                type="radio"
                name="role"
                checked={role === "admin"}
                onChange={() => {
                  setRole("admin");
                }}
              />{" "}
              admin
            </li>
            <li>
              <input
                type="radio"
                name="role"
                checked={role === "member"}
                onChange={() => {
                  setRole("member");
                }}
              />{" "}
              member
            </li>
          </ul>
          {role !== member.role ? (
            <button className="btn1" onClick={() => updateRole()}>
              Save
            </button>
          ) : (
            ""
          )}
        </div>
      ) : (
        ""
      )}
      <p>Activity Log</p>
      {logs.length === 0 ? (
        "-"
      ) : (
        <div
          style={{
            border: "1px solid gray",
            width: "100%",
            height: 150,
            overflow: "auto",
          }}
        >
          <Log
            logs={logs}
            showUser={false}
            formatDate={formatDate}
            getLogText={getLogText}
          />
        </div>
      )}
    </>
  );
}

function BoardSetting({ board, myRole, deleteBoard }) {
  const [name, setName] = useState(board.name);
  const [desc, setDesc] = useState(board.desc);

  const updateBoard = async (action = "") => {
    try {
      const data =
        action === "rename-board"
          ? name
          : action === "edit-board-desc"
          ? desc
          : "";
      if (data === "") return;
      await boardApi.updateBoard({ id: board._id, action, data });
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <>
      <div>
        <p>Name</p>
        <input
          type="text"
          value={name}
          readOnly={myRole !== "owner" && myRole !== "admin"}
          className="fw"
          onChange={(e) => setName(e.target.value)}
        />
        <br />
        {name !== board.name ? (
          <button
            className={"btn1"}
            onClick={() => {
              updateBoard("rename-board");
            }}
          >
            Save
          </button>
        ) : (
          ""
        )}
      </div>
      <div>
        <p>Desc</p>
        <textarea
          rows={4}
          className="fw"
          defaultValue={desc}
          readOnly={myRole !== "owner" && myRole !== "admin"}
          onChange={(e) => {
            setDesc(e.target.value);
          }}
        ></textarea>
        <br />
        {desc !== board.desc ? (
          <button
            className={"btn1"}
            onClick={() => {
              updateBoard("edit-board-desc");
            }}
          >
            Save
          </button>
        ) : (
          ""
        )}
      </div>
      <div>
        <p>Owner</p> {board.user.name} - {board.user.email}
      </div>
      <div>
        <p>Admin ({board.team.filter((t) => t.role === "admin").length})</p>
        {board.team
          .filter((t) => t.role === "admin")
          .map((a) => (
            <span key={a._id}>
              - {a.name} - {a.email} <br />
            </span>
          ))}
      </div>
      <div>
        <p>Member ({board.team.filter((t) => t.role === "member").length})</p>
        {board.team
          .filter((t) => t.role === "member")
          .map((a) => (
            <span key={a._id}>
              - {a.name} - {a.email} <br />
            </span>
          ))}
      </div>
      {}
      <div>
        <button
          className="btn1 bg-red fr"
          onClick={() => {
            if (!window.confirm("Hapus board?!")) return false;
            deleteBoard();
          }}
        >
          Delete
        </button>
      </div>
    </>
  );
}
