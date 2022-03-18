const express = require("express");
const router = express.Router();

const ObjectId = require("mongoose").Types.ObjectId;

const auth = require("../middleware/auth");
const boardRoles = require("../middleware/boardRoles");
const parseError = require("../util/parseError");

// models
const Board = require("../models/Board");
const User = require("../models/User");
const Log = require("../models/Log");

// test
router.get("/t/est", boardRoles("*"), async (req, res) => {
  // const users = Object.keys(io.sockets.sockets).map((s) => ({
  //   id: s,
  //   user: io.sockets.sockets[s].request.session.user,
  // }));
  //console.log(req.io.connectedUsers);

  //clients = await req.io.in("xx622b29cc1054b11a3494a3bf").clients();
  //console.log(clients);

  //req.io.to("622b29cc1054b11a3494a3bf").emit("test", `test ${new Date()}`);

  const users = Object.keys(req.io.connectedUsers).map((uid) => ({
    uid,
    email: req.io.connectedUsers[uid].email,
    name: req.io.connectedUsers[uid].name,
    connections: req.io.connectedUsers[uid].sockets.length,
  }));

  return res.json({
    connected: users.length,
    users,
  });
});

// get log activity
// all board members
router.get(
  ["/:id/log/", "/:id/log/:itemId"],
  [auth, boardRoles()],
  async (req, res) => {
    try {
      const { id, itemId } = req.params;
      const search =
        itemId === undefined ? { board: id } : { board: id, item: itemId };
      const data = await Log.find(search)
        .sort({ _id: -1 })
        .populate("user", "name")
        .populate("board", "name");
      // console.log(data);
      res.json(data);
    } catch (error) {
      console.log(error);
      const errData = parseError(error);
      return res.status(errData.statusCode).json(errData);
    }
  }
);

// detail board (id)
// all board members
router.get("/:id/", [auth, boardRoles()], async (req, res) => {
  try {
    const { id } = req.params;
    const data = await Board.findById(id)
      .populate("lists.items.members", "name email")
      .populate("user", "name email")
      .populate("team", "name email boardRoles")
      .lean();

    if (!data) throw { statusCode: 404 };

    data.team = data.team.map((t) => ({
      _id: t._id,
      name: t.name,
      email: t.email,
      role: t.boardRoles.find((tr) => tr.board.toString() === id).role,
    }));

    console.log(`- user : ${req.userId} request detail board "${id}"`);

    res.json(data);
  } catch (error) {
    const errData = parseError(error);
    return res.status(errData.statusCode).json(errData);
  }
});

// update board
// - edit name
// - edit desc
// - tambah user
// - del user
// - ?
// owner, admin
router.put("/", [auth, boardRoles(["owner", "admin"])], async (req, res) => {
  try {
    const { action, id, data } = req.body;
    const board = await Board.findById(id).select("team user name desc");
    if (!board) throw { statusCode: 404, msg: "board not found" };
    let returnData = null;
    // new log
    let newLog = new Log({
      user: req.session.user._id,
      date: new Date(),
      board: id,
    });
    switch (action) {
      case "rename-board":
        board.name = data;
        await board.save();
        // create log
        newLog.action = action;
        newLog.data = data;
        await newLog.save();
        returnData = {
          data,
          newLog: {
            ...newLog._doc,
            user: { _id: newLog.user._id, name: req.session.user.name },
          },
        };
        break;
      case "edit-board-desc":
        board.desc = data;
        await board.save();
        // create log
        newLog.action = action;
        newLog.data = data;
        await newLog.save();
        returnData = {
          data,
          newLog: {
            ...newLog._doc,
            user: { _id: newLog.user._id, name: req.session.user.name },
          },
        };
        break;
      case "add-member":
        if (data === req.session.user.email) throw { statusCode: 400 };
        const user = await User.findOne({ email: data }).select("-password");
        if (!user) throw { statusCode: 400, msg: "User does not exist" };
        // cek exist
        if (board.team.indexOf(user._id) !== -1)
          throw { statusCode: 400, msg: "user already exist" };
        // save board
        board.team.push(user._id);
        await board.save();
        // update user boardRoless
        user.boardRoles.push({ board: id, role: "member" });
        await user.save();
        delete user.boardRoles;
        // create log
        newLog.action = "new-boardMember";
        newLog.data = user;
        await newLog.validateSync();
        await newLog.save();

        returnData = {
          user,
          newLog: {
            ...newLog._doc,
            user: { _id: newLog.user._id, name: req.session.user.name },
          },
        };
        console.log(
          `- user : ${req.session.user._id} menambahkan user : "${user._id}" ke board : ${id}`
        );

        if (req.io.connectedUsers[user._id])
          req.io.connectedUsers[user._id].sockets.forEach((socket) =>
            req.io.to(socket.id).emit(action, {
              _id: board._id,
              name: board.name,
              desc: board.desc,
            })
          );
        break;
      case "delete-member":
        // owner gk isa dikick
        if (data._id.toString() === board.user.toString())
          throw { statusCode: 400, msg: "update failed" };
        // delete from team
        board.team = board.team.filter(
          (t) => t._id.toString() !== data._id.toString()
        );
        await board.save();
        // update user boardRoles
        console.log("pull", data._id.toString(), id);
        await User.findByIdAndUpdate(data._id.toString(), {
          $pull: { boardRoles: { board: id } },
        });
        // create log
        newLog.action = "delete-boardMember";
        newLog.data = data;
        await newLog.validateSync();
        await newLog.save();

        returnData = {
          id,
          user: data,
          newLog: {
            ...newLog._doc,
            user: { _id: newLog.user._id, name: req.session.user.name },
          },
        };
        if (req.io.connectedUsers[data._id])
          req.io.connectedUsers[data._id].sockets.forEach((socket) =>
            req.io.to(socket.id).emit("delete-board", id)
          );
        break;
      default:
        throw { statusCode: 400, msg: "update failed" };
    }

    // response
    req.io.to(id).emit(action, returnData);
    res.json(returnData);
  } catch (error) {
    console.log(error);
    const errData = parseError(error);
    res.status(errData.statusCode).json(errData);
  }
});

// update role
// owner only
router.put("/set-role", [auth, boardRoles(["owner"])], async (req, res) => {
  try {
    const { id, user, role } = req.body;
    // update role
    const arrayFilters = [{ "boardRole.board": id }];
    updateData = {
      $set: { "boardRoles.$[boardRole].role": role },
    };
    const update = await User.updateOne({ _id: user._id }, updateData, {
      arrayFilters,
    });
    // log
    const newLog = new Log({
      user: req.session.user._id,
      date: new Date(),
      board: id,
      action: "update-role",
      data: { user, role },
    });
    await newLog.save();
    console.log("update role", update);

    // response, io
    req.io.to(id).emit("update-role", {
      update: { user, role },
      log: {
        ...newLog._doc,
        user: { _id: newLog.user._id, name: req.session.user.name },
      },
    });
    if (req.io.connectedUsers[user._id])
      req.io.connectedUsers[user._id].sockets.forEach((s) =>
        req.io.to(s.id).emit("new-roles")
      );
    return res.json({ message: "ok" });
  } catch (error) {
    console.log(error);
    const errData = parseError(error);
    res.status(errData.statusCode).json(errData);
  }
});

// tambah list baru
// all board members
router.post("/lists", [auth, boardRoles()], async (req, res) => {
  try {
    const { id, title } = req.body;
    // create list
    const board = await Board.findById(id).select("lists");
    if (!board) throw { statusCode: 404 };
    const index = board.lists.length
      ? Math.max(...board.lists.map((l) => l.index)) + 1
      : 1;
    const newList = { _id: ObjectId(), title, index, items: [] };
    board.lists.push(newList);
    await board.save();
    console.log(
      `- user : ${req.session.user._id} menambahkan list : "${title}" ke board : ${id}`
    );
    // create log
    const newLog = new Log({
      user: req.session.user._id,
      date: new Date(),
      board: id,
      list: { _id: newList._id, name: title },
      action: "new-list",
      data: title,
    });
    await newLog.validateSync();
    await newLog.save();
    // data
    const returnData = {
      newList,
      newLog: {
        ...newLog._doc,
        user: { _id: newLog.user._id, name: req.session.user.name },
      },
    };
    req.io.to(id).emit("new-list", returnData);
    res.json(returnData);
  } catch (error) {
    const errData = parseError(error);
    res.status(errData.statusCode).json(errData);
  }
});

// item baru
// all board members
router.post("/items", [auth, boardRoles()], async (req, res) => {
  try {
    const { id, selectedList, selectedListName, name } = req.body;
    let board = await Board.findById(id).select("lists");
    if (!board || !board.lists.length) throw { statusCode: 404 };
    let newItem = null;
    const newItemData = { _id: ObjectId(), name };
    board.lists = board.lists.map((list) => {
      if (list._id.toString() === selectedList) {
        list.items.push(newItemData);
        newItem = list.items[list.items.length - 1];
      }
      return list;
    });
    // board.lists[0].items.push({ name });
    await board.save();
    // create log
    const newLog = new Log({
      user: req.session.user._id,
      date: new Date(),
      board: id,
      list: { _id: selectedList, name: selectedListName },
      item: newItemData,
      action: "new-item",
      data: name,
    });
    await newLog.validateSync();
    await newLog.save();

    console.log(
      `- user : ${req.session.user._id} menambahkan item : "${newItem.name}" ke list : ${selectedList} di board : ${id}`
    );

    const returnData = {
      newItem,
      newLog: {
        ...newLog._doc,
        user: { _id: newLog.user._id, name: req.session.user.name },
      },
    };
    req.io.to(id).emit("new-item", returnData);
    res.json(returnData);
  } catch (error) {
    const errData = parseError(error);
    res.status(errData.statusCode).json(errData);
  }
});

// ubah urutan list/item
// all board members
router.put("/reorder", [auth, boardRoles()], async (req, res) => {
  try {
    /* pindah item
    id: '6227918bcba7fd12f4cd6fbe', // id item
    source: { index: 0, droppableId: '62279198cba7fd12f4cd6fc0' }, // index yg dipindah, id list asal
    destination: { droppableId: '62279198cba7fd12f4cd6fc0', index: 2 }, // id list tujuan, index
    type: 'item'
    */
    /* pindah list
    id: '6227918bcba7fd12f4cd6fbe', // id list
    source: { index: 0, droppableId: 'content' }, // index asal
    destination: { droppableId: 'content', index: 1 }, // index tujuan
    type: 'list
    */
    const { id, source, destination, type } = req.body;
    const boardList = await Board.findById(id).select("lists");
    // log
    const newLog = new Log({
      user: req.session.user._id,
      date: new Date(),
      board: boardList._id,
      data: { id, source, destination },
    });
    let update = null;
    if (type === "item") {
      newLog.action =
        source.droppableId === destination.droppableId
          ? "reorder-item"
          : "move-item";
      const [item] = boardList.lists
        .find((list) => list._id.toString() === source.droppableId)
        .items.splice(source.index, 1);
      newLog.item = { _id: item._id, name: item.name };
      if (!item) throw { statusCode: 400 };
      const lists = boardList.lists.map((l) => {
        if (l._id.toString() === destination.droppableId) {
          l.items.splice(destination.index, 0, item);
          if (source.droppableId === destination.droppableId)
            newLog.list = { _id: l._id, name: l.title };
          else newLog.destinationList = { _id: l._id, name: l.title };
        }
        if (
          source.droppableId != destination.droppableId &&
          l._id.toString() === source.droppableId
        )
          newLog.sourceList = { _id: l._id, name: l.title };
        return l;
      });
      update = { lists };
      console.log(`${req.session.user._id} mengubah urutan item ${id}`);
    } else if (type === "list") {
      newLog.action = "reorder-list";
      const [item] = boardList.lists.splice(source.index, 1);
      newLog.list = { _id: item._id, name: item.title };
      boardList.lists.splice(destination.index, 0, item);
      update = { lists: boardList.lists };
    } else throw { statusCode: 400 };
    // update
    await Board.findByIdAndUpdate(id, update);
    // save log
    newLog.validateSync();
    newLog.save();

    const returnData = {
      data: { source, destination, type },
      log: {
        ...newLog._doc,
        user: { _id: newLog.user._id, name: req.session.user.name },
      },
    };
    //console.log(returnData.log);
    req.io.to(id).emit("reorder", returnData);
    res.json(returnData);
  } catch (error) {
    const errData = parseError(error);
    return res.status(errData.statusCode).json(errData);
  }
});

// update item
// all board members
router.put("/items", [auth, boardRoles()], async (req, res) => {
  try {
    const update = await updateItem(req.body, req.session);
    if (!update.nModified) throw { statusCode: 400, msg: "update failed" };

    req.io.to(req.body.id).emit("update-item", update.data);
    res.json(update.data);
  } catch (error) {
    const errData = parseError(error);
    res.status(errData.statusCode).json(errData);
  }
});

// fungsi update item
async function updateItem(reqData, sess) {
  const { id, listId, itemId, listName, itemName, action, data } = reqData;
  if (!id || !listId || !itemId || !action || (!data && action !== "update-dd"))
    throw { statusCode: 400, msg: "update failed" };
  try {
    let updateData = null;
    let newData = null;
    let arrayFilters = [{ "list._id": listId }, { "item._id": itemId }];
    let log = "";
    // log
    const newLog = new Log({
      user: sess.user._id,
      date: new Date(),
      board: id,
      list: { _id: listId, name: listName },
      item: { _id: itemId, name: itemName },
      action,
      data: null,
    });
    // action
    switch (action) {
      // tambah label
      case "new-label":
        // { name: 'test', color: '#FFFFFF' }
        newData = { _id: ObjectId(), ...data };
        updateData = {
          $push: { "lists.$[list].items.$[item].labels": newData },
        };
        log += `menambah label '${data.name}' `;
        // log data
        newLog.data = data.name;
        break;
      // hapus label
      case "delete-label":
        // { _id: '622216c440e18917c0a33e3b', name: 'labelname' }
        console.log(data);
        updateData = {
          $pull: { "lists.$[list].items.$[item].labels": { _id: data._id } },
        };
        log += `menghapus label '${data.name}' `;
        // log data
        newLog.data = data.name;
        break;
      // ubah deskripsi
      case "update-desc":
        // "deskripsi"
        updateData = { "lists.$[list].items.$[item].desc": data };
        log += `mengubah deskripsi : '${data}' `;
        // log data
        newLog.data = data;
        break;
      // ubah name
      case "rename-item":
        // {old:"oldname", new:"namaitem abcs xanfsa"}
        updateData = { "lists.$[list].items.$[item].name": data.new };
        log += `mengubah nama : '${data}' `;
        // log data
        newLog.data = data;
        break;
      // tambah checklist
      case "new-checklist":
        // {name: '123'}
        newData = { _id: ObjectId(), name: data.name, completed: false };
        updateData = {
          $push: { "lists.$[list].items.$[item].checkList": newData },
        };
        log += `menambah checklist '${data.name}' `;
        // log data
        newLog.data = data.name;
        break;
      // ubah checklist
      case "update-checklist":
        // { _id: '62222b6577b68e1708fa1819', name: "test", completed: true }
        updateData = {
          "lists.$[list].items.$[item].checkList.$[checkList].completed":
            data.completed,
        };
        arrayFilters.push({ "checkList._id": data._id });
        log += `mengubah checklist "${data._id} -> completed:${data.completed}" `;
        // log data
        newLog.data = data;
        break;
      // hapus cheklist
      case "delete-checklist":
        // { _id: '622216c440e18917c0a33e3b', name: 'checkname' }
        updateData = {
          $pull: { "lists.$[list].items.$[item].checkList": { _id: data._id } },
        };
        log += `menghapus checklist '${data.name}' `;
        // log data
        newLog.data = data.name;
        break;
      // ubah tanggal
      case "update-dd":
        updateData = { "lists.$[list].items.$[item].dd": data };
        log += `mengubah tanggal -> "${data}" `;
        // log data
        newLog.data = data;
        break;
      // ubah member
      case "update-members":
        // { _id: '622216c440e18917c0a33e3b', checked: true }
        const user = await User.findById(data._id).select("-password");
        if (!user) throw { statusCode: 404, msg: "user not found" };
        updateData = data.checked
          ? { $push: { "lists.$[list].items.$[item].members": user._id } }
          : { $pull: { "lists.$[list].items.$[item].members": user._id } };
        if (data.checked) newData = { user, ...data };
        log += `${data.checked ? "menambah" : "menghapus"} user "${user._id}" `;
        // log data
        newLog.data = data;
        break;
      default:
        throw { statusCode: 400, msg: "update failed" };
    }
    // insert log
    newLog.validateSync();
    await newLog.save();
    // update
    const update = await Board.updateOne({ _id: id }, updateData, {
      arrayFilters,
    });
    log += `(item:${itemId}) (list:${listId})`;
    console.log(log);
    return {
      ...update,
      data: {
        update: newData || data,
        log: {
          ...newLog._doc,
          user: { _id: newLog.user._id, name: sess.user.name },
        },
      },
    };
  } catch (error) {
    console.log(error);
    throw error;
  }
}

router.delete("/item", [auth, boardRoles()], async (req, res) => {
  try {
    const { id, listId, itemId, listName, itemName } = req.body;
    console.log("deleting item", { id, listId, itemId });
    const arrayFilters = [{ "list._id": listId }];
    const update = await Board.updateOne(
      { _id: id },
      { $pull: { "lists.$[list].items": { _id: itemId } } },
      { arrayFilters }
    );

    const newLog = new Log({
      user: req.session.user._id,
      date: new Date(),
      board: id,
      list: { _id: listId, name: listName },
      item: { _id: itemId, name: itemName },
      action: "delete-item",
      data: null,
    });
    newLog.save();

    const returnData = {
      update,
      id,
      listId,
      itemId,
      newLog: {
        ...newLog._doc,
        user: { _id: newLog.user._id, name: req.session.user.name },
      },
    };
    req.io.to(id).emit("delete-item", returnData);
    res.json(returnData);
  } catch (error) {
    console.log(error);
    const errData = parseError(error);
    res.status(errData.statusCode).json(errData);
  }
});

router.delete("/list", [auth, boardRoles()], async (req, res) => {
  try {
    const { id, listId, listName } = req.body;
    const update = await Board.updateOne(
      { _id: id },
      { $pull: { lists: { _id: listId } } }
    );

    const newLog = new Log({
      user: req.session.user._id,
      date: new Date(),
      board: id,
      list: { _id: listId, name: listName },
      action: "delete-list",
      data: null,
    });
    newLog.save();
    const returnData = {
      update,
      id,
      listId,
      newLog: {
        ...newLog._doc,
        user: { _id: newLog.user._id, name: req.session.user.name },
      },
    };

    req.io.to(id).emit("delete-list", returnData);
    res.json(returnData);
  } catch (error) {
    console.log(error);
    const errData = parseError(error);
    res.status(errData.statusCode).json(errData);
  }
});

router.delete("/", [auth, boardRoles()], async (req, res) => {
  try {
    const { id } = req.body;
    // get board : user&team
    const board = await Board.findById(id).select("user team");
    if (!board) throw { statusCode: 404, msg: "board not found" };
    const users = [board.user, ...board.team];
    // delete
    await Board.deleteOne({ _id: id });

    // req.io.to(id).emit("delete-board", { id }); // to board
    users.forEach((user) => {
      if (req.io.connectedUsers[user])
        req.io.connectedUsers[user].sockets.forEach((socket) => {
          socket.leave(id);
          req.io.to(socket.id).emit("delete-board", id);
        });
    });
    res.json({ id });
  } catch (error) {
    console.log(error);
    const errData = parseError(error);
    res.status(errData.statusCode).json(errData);
  }
});

// router.get("/testInsert", async (req, res) => {
//   const testData = {
//     name: "Board Test",
//     list: [
//       {
//         title: "List1",
//         index: 1,
//         items: [
//           {
//             name: "Item1",
//             desc: "item numbawan",
//             labels: [
//               {
//                 name: "important!",
//                 color: "red",
//               },
//             ],
//           },
//           {
//             name: "Item 3",
//             desc: "item numbatri",
//           },
//           {
//             name: "Item 3",
//             desc: "item numbafo",
//             dd: new Date("2020-04-20"),
//           },
//         ],
//       },
//       {
//         title: "List2",
//         index: 2,
//         items: [
//           {
//             name: "Item2",
//             desc: "item numbatu",
//           },
//         ],
//       },
//     ],
//   };
//   try {
//     const newBoard = new Board(testData);
//     await newBoard.save();
//     res.send("ok");
//   } catch (error) {
//     res.status(500).send(error);
//   }
// });

module.exports = router;
