///////////////////////////////
// Import Router
////////////////////////////////
const router = require("express").Router()
const bcrypt = require("bcrypt") 
const User = require("../models/Image")


///////////////////////////////
// Custom Middleware Functions
////////////////////////////////

// Middleware to check if userId is in sessions and create req.user
const addUserToRequest = async (req, res, next) => {
  if (req.session.userId) {
    req.user = await User.findById(req.session.userId)
    next()
  } else {
    next()
  }
}

// Auth Middleware Function to check if user authorized for route
const isAuthorized = (req, res, next) => {
  // check if user session property exists, if not redirect back to login page
  if (req.user) {
    //if user exists, wave them by to go to route handler
    next()
  } else {
    //redirect the not logged in user
    res.redirect("/auth/login")
  }
}

///////////////////////////////
// Router Specific Middleware
////////////////////////////////

router.use(addUserToRequest)

///////////////////////////////
// Router Routes
////////////////////////////////
router.get("/", (req, res) => {
    res.render("home")
})

router.get("/auth/signup", (req, res) => {
    res.render("auth/signup")
})

router.post("/auth/signup", async (req, res) => {
  try {
    // generate salt for hashing
    const salt = await bcrypt.genSalt(10)
    // hash the password
    req.body.password = await bcrypt.hash(req.body.password, salt)
    // Create the User
    await User.create(req.body)
    // Redirect to login page
    res.redirect("/auth/login")
  } catch (error) {
    res.json(error)
  }
})

router.get("/auth/login", (req, res) => {
    res.render("auth/login")
})

router.post("/auth/login", async (req, res) => {
    try {
      //check if the user exists (make sure to use findOne not find)
      const user = await User.findOne({ username: req.body.username })
      if (user) {
        // check if password matches
        const result = await bcrypt.compare(req.body.password, user.password)
        if (result) {
          // create user session property
          req.session.userId = user._id
          //redirect to /images
          res.redirect("/images")
        } else {
          // send error is password doesn't match
          res.json({ error: "passwords don't match" })
        }
      } else {
        // send error if user doesn't exist
        res.json({ error: "User does not exist" })
      }
    } catch (error) {
      res.json(error)
    }
  })

router.get("/auth/logout", (req, res) => {
    // remove the user property from the session
    req.session.userId = null
    // redirect back to the main page
    res.redirect("/")
  })

router.get("/images", isAuthorized, async (req, res) => {
  // get updated user
  const user = await User.findOne({ username: req.user.username })
  // render template passing it list of goals
  res.render("images", {
    images: user.images
  })
})

// Goals create route when form submitted
router.post("/images", isAuthorized, async (req, res) => {
  // fetch up to date user
  const user = await User.findOne({ username: req.user.username })
  // push new goal and save
  user.images.push(req.body)
  await user.save()
  // redirect back to goals index
  res.redirect("/images")
})

router.get("/images/:id/edit", isAuthorized, async (req,res) => {
  const user = await User.findById(req.session.userId)
  let img = user.images.find(usr => {
      return usr._id == req.params.id
  })
  res.render("editImage", { img })
})

router.post("/images/:id/edit", isAuthorized, async (req,res) => {
  await User.findOneAndUpdate({_id: req.session.userId, 'images._id': req.params.id} , { '$set': { 'images.$.url': req.body.url } } , (error, result) => {
    if(error) {
        console.log(error)
    } else {
        // redirect back to main page
        res.redirect("/images")
    }
  })
})

router.delete("/images/:id", isAuthorized, async (req, res) => {
  await User.findOneAndUpdate({_id: req.session.userId, 'images._id': req.params.id}, {'$pull': { 'images': { _id : req.params.id} } }, (error, result) => {
    if(error) {
        console.log(error)
    } else {
        // redirect back to main page
        res.redirect("/images")
    }
  })
})
///////////////////////////////
// Export Router
////////////////////////////////
module.exports = router