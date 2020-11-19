import React, { Component } from 'react';
import { Col, FormGroup, Input, Label, Row } from 'reactstrap';
import { SessionDto } from '../interfaces/SessionDto';

interface HomeProps {}

interface HomeState {
  sessionInfo: SessionDto
}

export class Home extends Component<HomeProps, HomeState> {
  static displayName = Home.name;

  state: HomeState = {
    sessionInfo: {
      id: "",
      titleBackgroundColor: "darkslategray",
      titleTextColor: "white",
      titleText: "Confer Chat",
      logoUrl: "/assets/webcam.png",
      pageBackgroundColor: "lightgray",
      pageTextColor: "black"
    }
  }

  render() {
    const {
      logoUrl,
      pageBackgroundColor,
      pageTextColor,
      titleBackgroundColor,
      titleText,
      titleTextColor
    } = this.state.sessionInfo;

    return (
      <div>
        <h1 className="mt-2">Welcome to Confer!</h1>
        <h5 className="mt-5 muted">
          Fill out this form to start a branded video chat session.
        </h5>

        <Row className="mt-4">
          <Col sm={12} md={10} lg={8} xl={6}>
            <h3>Session Options</h3>
            <FormGroup>
              <Label>Title Text</Label>
              <Input
                type="text"
                value={titleText}
                onChange={ev => {
                  this.setState({
                    sessionInfo: {
                      ...this.state.sessionInfo,
                      titleText:  ev.currentTarget.value
                    }
                  })
                }}
              />
            </FormGroup>
            <FormGroup>
              <Label>Title Text Color</Label>
              <Input
                type="text"
                value={titleTextColor}
                onChange={ev => {
                  this.setState({
                    sessionInfo: {
                      ...this.state.sessionInfo,
                      titleTextColor:  ev.currentTarget.value
                    }
                  })
                }}
              />
            </FormGroup>
            <FormGroup>
              <Label>Title Background Color</Label>
              <Input
                type="text"
                value={titleBackgroundColor}
                onChange={ev => {
                  this.setState({
                    sessionInfo: {
                      ...this.state.sessionInfo,
                      titleBackgroundColor:  ev.currentTarget.value
                    }
                  })
                }}
              />
            </FormGroup>
            <FormGroup>
              <Label>Logo URL</Label>
              <Input
                type="text"
                value={logoUrl}
                onChange={ev => {
                  this.setState({
                    sessionInfo: {
                      ...this.state.sessionInfo,
                      logoUrl:  ev.currentTarget.value
                    }
                  })
                }}
              />
            </FormGroup>
            <FormGroup>
              <Label>Page Background Color</Label>
              <Input
                type="text"
                value={pageBackgroundColor}
                onChange={ev => {
                  this.setState({
                    sessionInfo: {
                      ...this.state.sessionInfo,
                      pageBackgroundColor:  ev.currentTarget.value
                    }
                  })
                }}
              />
            </FormGroup>
            <FormGroup>
              <Label>Page Text Color</Label>
              <Input
                type="text"
                value={pageTextColor}
                onChange={ev => {
                  this.setState({
                    sessionInfo: {
                      ...this.state.sessionInfo,
                      pageTextColor:  ev.currentTarget.value
                    }
                  })
                }}
              />
            </FormGroup>
            <FormGroup className="text-right">
              <button className="btn btn-lg btn-primary"
                type="button"
                onClick={async () => {
                  try {
                    var response = await fetch("/api/sessions/", {
                      body: JSON.stringify(this.state.sessionInfo),
                      method: "post",
                      headers: {
                        'Content-Type': 'application/json'
                      }
                    });
                    var result = await response.json();
                    if (result.id) {
                      window.location.assign("/session/" + result.id);
                    }
                    else {
                      throw new Error("Session ID was not returned.");
                      
                    }
                  }
                  catch (ex) {
                    console.error(ex);
                    alert("Error creating the session.");
                  }
                }}>
                Start
            </button>
            </FormGroup>
          </Col>
        </Row>

        <h5 className="mt-5 muted">
          Or send a POST to <code>/api/sessions</code> with the following structure:
        </h5>
        <div>
        <div style={{ display: "inline-block", whiteSpace: "pre" }}>
              <code>
                {
                  `{\n  "titleBackgroundColor": "rgb(50,50,50)",\n  "titleTextColor": "white",\n  "titleText": "Awesome Chats",\n  "logoUrl": "https://mywebsite.com/media/my_logo.png",\n  "pageBackgroundColor": "darkgray",\n  "pageTextColor": "black"\n}`
                }
              </code>
            </div>
        </div>
        <h6 className="my-4 muted">
          The response object will contain an <code>id</code> property.  Go to <code>{`/session/{id}`}</code> in your browser to start.
        </h6>
      </div>
    )
  }
}
