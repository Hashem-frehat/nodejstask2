import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "./login";
import SignUp from "./signup";
import Alltasks from "./taskform";

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<SignUp />} />
          <Route
            path="/alltasks"
            element={<PrivateRoute component={Alltasks} />}
          />
        </Routes>
      </div>
    </Router>
  );
}

const PrivateRoute = ({ component: Component, ...rest }) => {
  const token = localStorage.getItem("token");

  return token ? <Component {...rest} /> : <Navigate to="/" />;
};

export default App;
