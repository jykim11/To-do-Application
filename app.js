//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect(
    "mongodb+srv://junyeongkim1:rPi7ekvJVovUnizx@cluster0.mceddea.mongodb.net/todolistDB"
);

const itemsSchema = {
    name: String,
};

// Mongoose model const is usually capitalized.
// Inside model(), have to put singular.
const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
    name: "Welcome to your to-do list!",
});

const item2 = new Item({
    name: "Hit the + button to add a new item.",
});

const item3 = new Item({
    name: "<-- Hit this to delete an item.",
});

const defaultItems = [item1, item2, item3];

const listSchema = {
    name: String,
    items: [itemsSchema],
};

const List = mongoose.model("List", listSchema);

app.get("/", function (req, res) {
    Item.find({}).then(function (foundItems) {
        if (foundItems.length === 0) {
            Item.insertMany(defaultItems)
                .then(function () {
                    console.log("Successfully saved default items to DB.");
                })
                .catch(function (error) {
                    console.log(error);
                });
            res.redirect("/");
        } else {
            res.render("list", {
                listTitle: "Today",
                newListItems: foundItems,
            });
        }
    });

    //res.render("list", { listTitle: "Today", newListItems: items });
});

app.post("/", function (req, res) {
    const itemName = req.body.newItem;
    const listName = req.body.list;

    const item = new Item({
        name: itemName,
    });

    if (listName === "Today") {
        res.redirect("/");
        item.save();
    } else {
        List.findOne({ name: listName })
            .then((foundList) => {
                console.log("Here");
                foundList.items.push(item);
                res.redirect("/" + listName);
                foundList.save();
            })
            .catch((err) => {
                console.log(err);
            });
    }
});

app.post("/delete", function (req, res) {
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    if (listName === "Today") {
        Item.findByIdAndRemove(checkedItemId)
            .then(() => {
                console.log("Successfully Deleted");
            })
            .catch((error) => {
                console.log(error);
            });
        res.redirect("/");
    } else {
        List.findOneAndUpdate(
            { name: listName },
            { $pull: { items: { _id: checkedItemId } } }
        )
            .then(() => {
                res.redirect("/" + listName);
            })
            .catch((err) => {
                console.log(err);
            });
    }
});

app.get("/:customListName", function (req, res) {
    const customListName = _.capitalize(req.params.customListName);

    List.findOne({
        name: customListName,
    })
        .then((foundList) => {
            if (!foundList) {
                // Create a new list
                const list = new List({
                    name: customListName,
                    items: defaultItems,
                });
                res.redirect("/" + customListName);
                list.save();
            } else {
                // Show an existing list
                res.render("list", {
                    listTitle: foundList.name,
                    newListItems: foundList.items,
                });
            }
        })
        .catch((err) => {
            console.log(err);
        });
});

app.get("/about", function (req, res) {
    res.render("about");
});

let port = process.env.PORT || 3000;

app.listen(port, function () {
    console.log("Server started running.");
});
