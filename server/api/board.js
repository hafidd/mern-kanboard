const express = require("express");
const router = express.Router();

const ObjectId = require("mongoose").Types.ObjectId;

const auth = require("../middleware/auth");
const parseError = require("../util/parseError");

const Board = require("../models/Board");
const User = require("../models/User");

router.get("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const data = await Board.findById(id).populate(
      "lists.items.members",
      "name email"
    );
    if (!data) throw { statusCode: 404 };
    res.json(data);
  } catch (error) {
    const errData = parseError(error);
    return res.status(errData.statusCode).json(errData);
  }
});

router.get("/testInsert", async (req, res) => {
  const testData = {
    name: "Board Test",
    list: [
      {
        title: "List1",
        index: 1,
        items: [
          {
            name: "Item1",
            desc: "item numbawan",
            labels: [
              {
                name: "important!",
                color: "red",
              },
            ],
          },
          {
            name: "Item 3",
            desc: "item numbatri",
          },
          {
            name: "Item 3",
            desc: "item numbafo",
            dd: new Date("2020-04-20"),
          },
        ],
      },
      {
        title: "List2",
        index: 2,
        items: [
          {
            name: "Item2",
            desc: "item numbatu",
          },
        ],
      },
    ],
  };
  try {
    const newBoard = new Board(testData);
    await newBoard.save();
    res.send("ok");
  } catch (error) {
    res.status(500).send(error);
  }
});

router.post("/lists", auth, async (req, res) => {
  try {
    const { id, title } = req.body;
    const board = await Board.findById(id).select("lists");
    if (!board) throw { statusCode: 404 };
    const index = board.lists.length
      ? Math.max(...board.lists.map((l) => l.index)) + 1
      : 1;
    board.lists.push({ title, index });
    await board.save();
    res.json(board.lists[board.lists.length - 1]);
  } catch (error) {
    const errData = parseError(error);
    res.status(errData.statusCode).json(errData);
  }
});

router.post("/items", auth, async (req, res) => {
  try {
    const { id, selectedList, name } = req.body;
    let board = await Board.findById(id).select("lists");
    if (!board || !board.lists.length) throw { statusCode: 404 };
    let newItem = null;
    board.lists = board.lists.map((list) => {
      if (list._id.toString() === selectedList) {
        list.items.push({ name });
        newItem = list.items[list.items.length - 1];
      }
      return list;
    });
    // board.lists[0].items.push({ name });
    await board.save();
    res.json(newItem);
  } catch (error) {
    const errData = parseError(error);
    res.status(errData.statusCode).json(errData);
  }
});

router.put("/reorder", auth, async (req, res) => {
  try {
    const { id, source, destination, type } = req.body;
    const boardList = await Board.findById(id).select("lists");
    if (type === "item") {
      const [item] = boardList.lists
        .find((list) => list._id.toString() === source.droppableId)
        .items.splice(source.index, 1);
      if (!item) throw { statusCode: 400 };
      const lists = boardList.lists.map((l) => {
        if (l._id.toString() === destination.droppableId)
          l.items.splice(destination.index, 0, item);
        return l;
      });
      await Board.findByIdAndUpdate(id, { lists });
      //      setTimeout(() => {
      res.json({ source, destination, type });
      //      }, 1000);
    } else {
      const [item] = boardList.lists.splice(source.index, 1);
      boardList.lists.splice(destination.index, 0, item);
      await Board.findByIdAndUpdate(id, { lists: boardList.lists });
      res.json({ source, destination, type });
    }
  } catch (error) {
    const errData = parseError(error);
    return res.status(errData.statusCode).json(errData);
  }
});

router.put("/items", auth, async (req, res) => {
  try {
    const update = await updateItem(req.body);
    if (!update.nModified) throw { statusCode: 400, msg: "update failed" };
    res.json(update.data);
  } catch (error) {
    const errData = parseError(error);
    res.status(errData.statusCode).json(errData);
  }
});

// update item
async function updateItem(reqData) {
  const { id, listId, itemId, action, data } = reqData;
  if (!id || !listId || !itemId || !action || (!data && action !== "update-dd"))
    throw { statusCode: 400, msg: "update failed" };
  try {
    let updateData = null;
    let newData = null;
    let arrayFilters = [{ "list._id": listId }, { "item._id": itemId }];
    switch (action) {
      case "new-label":
        newData = { _id: ObjectId(), ...data };
        updateData = {
          $push: { "lists.$[list].items.$[item].labels": newData },
        };
        break;
      case "update-desc":
        updateData = { "lists.$[list].items.$[item].desc": data };
        break;
      case "new-member":
        const user = await User.findOne({ email: data }).select("-password");
        if (!user) throw { statusCode: 404, msg: "user not found" };
        newData = user;
        updateData = {
          $push: { "lists.$[list].items.$[item].members": user._id },
        };
        break;
      case "new-checklist":
        newData = { _id: ObjectId(), name: data.name, completed: false };
        console.log(newData);
        updateData = {
          $push: { "lists.$[list].items.$[item].checkList": newData },
        };
        break;
      case "update-checklist":
        updateData = {
          "lists.$[list].items.$[item].checkList.$[checkList].completed":
            data.completed,
        };
        arrayFilters.push({ "checkList._id": data._id });
        break;
      case "update-dd":
        console.log(data);
        updateData = { "lists.$[list].items.$[item].dd": data };
        break;
      default:
        throw { statusCode: 400, msg: "update failed" };
    }
    const update = await Board.updateOne({ _id: id }, updateData, {
      arrayFilters,
    });
    return { ...update, data: newData || data };
  } catch (error) {
    console.log(error);
    throw error;
  }
}

module.exports = router;
