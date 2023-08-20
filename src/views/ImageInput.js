import React, { Component } from "react";
import { withRouter } from "react-router-dom";
import { loadModels, getFullFaceDescription, createMatcher } from "../api/face";
import { Link } from "react-router-dom/cjs/react-router-dom.min";

// Import image to test API
const warnImg = require("../img/test.jpg");

// Import face profile
const JSON_PROFILE = require("../descriptors/bnk48.json");

// Initial State
const INIT_STATE = {
  imageURL: warnImg,
  fullDesc: null,
  detections: null,
  descriptors: null,
  match: null,
  noFacesDetected: false,
};

class ImageInput extends Component {
  constructor(props) {
    super(props);
    this.state = { ...INIT_STATE, faceMatcher: null };
  }

  componentWillMount = async () => {
    await loadModels();
    this.setState({ faceMatcher: await createMatcher(JSON_PROFILE) });
    await this.handleImage(this.state.imageURL);
  };

  handleImage = async (image = this.state.imageURL) => {
    await getFullFaceDescription(image).then((fullDesc) => {
      if (!!fullDesc) {
        this.setState({
          fullDesc,
          detections: fullDesc.map((fd) => fd.detection),
          descriptors: fullDesc.map((fd) => fd.descriptor),
          noFacesDetected: fullDesc.length === 0,
        });
      }
    });

    if (!!this.state.descriptors && !!this.state.faceMatcher) {
      let match = await this.state.descriptors.map((descriptor) =>
        this.state.faceMatcher.findBestMatch(descriptor),
      );
      this.setState({ match });
    }
  };

  handleFileChange = async (event) => {
    this.resetState();
    await this.setState({
      imageURL: URL.createObjectURL(event.target.files[0]),
      loading: true,
    });
    this.handleImage();
  };

  resetState = () => {
    this.setState({ ...INIT_STATE });
  };

  render() {
    const { imageURL, detections, match, noFacesDetected } = this.state;

    let drawBox = null;
    if (!!detections) {
      drawBox = detections.map((detection, i) => {
        let _H = detection.box.height;
        let _W = detection.box.width;
        let _X = detection.box._x;
        let _Y = detection.box._y;
        return (
          <div key={i}>
            <div
              style={{
                position: "absolute",
                border: "solid",
                borderColor: "blue",
                height: _H,
                width: _W,
                transform: `translate(${_X}px,${_Y}px)`,
              }}
            >
              {!!match ? (
                <p
                  style={{
                    backgroundColor: "blue",
                    border: "solid",
                    borderColor: "blue",
                    width: _W,
                    marginTop: 0,
                    color: "#fff",
                    transform: `translate(-3px,${_H}px)`,
                  }}
                >
                  {match[i]._label}
                </p>
              ) : null}
            </div>
          </div>
        );
      });
    }

    let detectionMessage;
    if (noFacesDetected) {
      detectionMessage = (
        <p style={{ color: "red" }}>
          No Faces Detected. Choose a picture with a face.
        </p>
      );
    } else if (!!detections) {
      detectionMessage = <p>Faces Detected: {detections.length}</p>;
    }

    return (
      <div>
        <Link to={"/"}>Home page</Link>
        <input
          id="myFileUpload"
          type="file"
          onChange={this.handleFileChange}
          accept=".jpg, .jpeg, .png"
        />
        {detectionMessage}
        <div style={{ position: "relative" }}>
          <div style={{ position: "absolute" }}>
            {noFacesDetected ? "" : <img src={imageURL} alt="imageURL" />}
          </div>
          {!!drawBox ? drawBox : null}
        </div>
      </div>
    );
  }
}

export default withRouter(ImageInput);
