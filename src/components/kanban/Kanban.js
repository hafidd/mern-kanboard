import React, { useEffect, useState, useCallback } from "react";
import { DragDropContext, Draggable, Droppable } from "react-beautiful-dnd";
import { useParams, useHistory } from "react-router-dom";

import { cloneDeep } from "lodash";

import useUser from "../../context/hooks/useUser";

import * as boardApi from "../../api/board";

import Modal from "../Modal";
import ItemDetail from "./ItemDetail";

export default function () {
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(false);

  const [modal, setModal] = useState(false);
  const [modalTitle, setModalTitle] = useState(null);
  const [modalContent, setModalContent] = useState(null);
  const [selectedListId, setSelectedListId] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);

  const { id } = useParams();
  const history = useHistory();

  const { user } = useUser();

  // test show item 5e913b41c34f485db8b74d1b
  useEffect(() => {
    return;
    if (lists.length) {
      const item = lists[1].items.find(
        (i) => i._id.toString() === "5e913b41c34f485db8b74d1b"
      );
      setSelectedListId("5e913a2cc34f485db8b74d18");
      if (item) showModal(item.name, "detail", item);
    }
  }, [lists]);

  const loadBoard = useCallback(() => {
    setLoading(true);
    boardApi
      .loadBoard(id)
      .then((res) => setLists(res.data.lists))
      .catch(() => history.push("/"))
      .finally(() => setLoading(false));
  }, [id, history]);

  useEffect(() => {
    user._id && loadBoard();
  }, [user._id, loadBoard]);

  useEffect(() => {
    if (selectedListId && !modal) setSelectedListId(null);
  }, [lists, selectedListId, modal]);

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
    const newLists = reorder(lists, e);
    setLists(newLists);
    try {
      setLoading(true);
      await boardApi.reorder({ id, source, destination, type });
      setLoading(false);
    } catch (err) {
      loadBoard(); // reload
    }
  };

  const updateItem = async (action, data) => {
    try {
      setLoading(true);
      const res = await boardApi.updateItem({
        id,
        listId: selectedListId,
        itemId: selectedItem._id,
        action,
        data,
      });

      const newLists = cloneDeep(lists).map((list) => {
        if (list._id === selectedListId)
          list.items = list.items.map((item) => {
            if (item._id === selectedItem._id) {
              if (action === "new-label") item.labels.push(res.data);
              if (action === "update-desc") item.desc = res.data;
              if (action === "update-dd") item.dd = res.data;
              if (action === "new-member") item.members.push(res.data);
              if (action === "new-checklist") item.checkList.push(res.data);
              if (action === "update-checklist")
                item.checkList = item.checkList.map((cl) => {
                  if (cl._id === res.data._id)
                    cl.completed = res.data.completed;
                  return cl;
                });
              setSelectedItem(item);
            }
            return item;
          });
        return list;
      });

      setLists(newLists);
      setLoading(false);
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

  return (
    <div className="board">
      <Modal title={modalTitle} visible={modal} setVisible={setModal}>
        {modalContent === "list" ? (
          <NewList
            id={id}
            setLoading={setLoading}
            setLists={setLists}
            setModal={setModal}
          />
        ) : modalContent === "item" ? (
          <NewItem
            id={id}
            selectedList={selectedListId}
            lists={lists}
            setLoading={setLoading}
            setLists={setLists}
            setModal={setModal}
          />
        ) : modalContent === "detail" ? (
          <ItemDetail item={selectedItem} updateItem={updateItem} />
        ) : (
          ""
        )}
      </Modal>
      <div className="board-menu">
        <h3>Board Name</h3>
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
                        <button className="btn-a fr" onClick={() => i}>
                          <span>...</span>
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
                              <button
                                className="btn-a fw"
                                onClick={() => {
                                  setSelectedListId(d._id);
                                  showModal("New Item", "item");
                                }}
                              >
                                + New card
                              </button>
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
}

function Item({ list }) {
  return (
    <React.Fragment>
      <p>{list.name}</p>
      {list.dd && (
        <button>
          <span role="img" aria-label="">
            🕑
          </span>{" "}
          {new Date(list.dd).getDate()}
        </button>
      )}
      {list.labels &&
        list.labels.map((label) => (
          <button
            key={label.name + Math.random()}
            style={{
              backgroundColor: label.color || "white",
            }}
          >
            {label.name}
          </button>
        ))}
      {list.labels && <br />}
      {list.members &&
        list.members.map((mm) => <span key={mm._id}>{mm.name}</span>)}
    </React.Fragment>
  );
}

function NewList({ id, setLists, setLoading, setModal }) {
  const [title, setTitle] = useState("");

  const submitNewList = async () => {
    try {
      if (!title.trim()) return;
      setLoading(true);
      const { data } = await boardApi.newList({ id, title });
      setLists((prevLists) => [...prevLists, data]);
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

function NewItem({ lists, selectedList, id, setLoading, setLists, setModal }) {
  const [name, setName] = useState("");

  const submitNewItem = async (i = 0) => {
    try {
      if (!name.trim()) return;
      setLoading(true);
      const { data } = await boardApi.newItem({ id, selectedList, name });
      const newList = cloneDeep(lists).map((ls) => {
        if (ls._id === selectedList) ls.items.push(data);
        return ls;
      });
      setLists(newList);
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
