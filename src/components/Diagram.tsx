import * as React from "react";
import * as go from "gojs";
import { ReactDiagram } from "gojs-react";

// props passed in from a parent component holding state, some of which will be passed to ReactDiagram
interface WrapperProps {
  nodeDataArray: Array<go.ObjectData>;
  linkDataArray: Array<go.ObjectData>;
  modelData: go.ObjectData;
  skipsDiagramUpdate: boolean;
  onDiagramEvent: (e: go.DiagramEvent) => void;
  onModelChange: (e: go.IncrementalData) => void;
}

export class DiagramWrapper extends React.Component<WrapperProps, {}> {
  /**
   * Ref to keep a reference to the component, which provides access to the GoJS diagram via getDiagram().
   */
  private diagramRef: React.RefObject<ReactDiagram>;

  constructor(props: WrapperProps) {
    super(props);
    this.diagramRef = React.createRef();
    addDatabaseShape();
  }

  /**
   * Get the diagram reference and add any desired diagram listeners.
   * Typically the same function will be used for each listener,
   * with the function using a switch statement to handle the events.
   * This is only necessary when you want to define additional app-specific diagram listeners.
   */
  public componentDidMount() {
    if (!this.diagramRef.current) return;
    const diagram = this.diagramRef.current.getDiagram();
    if (diagram instanceof go.Diagram) {
      diagram.addDiagramListener("ChangedSelection", this.props.onDiagramEvent);
    }
  }

  /**
   * Get the diagram reference and remove listeners that were added during mounting.
   * This is only necessary when you have defined additional app-specific diagram listeners.
   */
  public componentWillUnmount() {
    if (!this.diagramRef.current) return;
    const diagram = this.diagramRef.current.getDiagram();
    if (diagram instanceof go.Diagram) {
      diagram.removeDiagramListener(
        "ChangedSelection",
        this.props.onDiagramEvent
      );
    }
  }

  /**
   * Diagram initialization method, which is passed to the ReactDiagram component.
   * This method is responsible for making the diagram and initializing the model, any templates,
   * and maybe doing other initialization tasks like customizing tools.
   * The model's data should not be set here, as the ReactDiagram component handles that via the other props.
   */
  private initDiagram(): go.Diagram {
    const $ = go.GraphObject.make;
    // set your license key here before creating the diagram: go.Diagram.licenseKey = "...";
    const diagram = $(go.Diagram, {
      "undoManager.isEnabled": true, // must be set to allow for model change listening
      // 'undoManager.maxHistoryLength': 0,  // uncomment disable undo/redo functionality
      "clickCreatingTool.archetypeNodeData": {
        text: "new node",
        color: "lightblue",
      },
      model: $(go.GraphLinksModel, {
        linkKeyProperty: "key", // IMPORTANT! must be defined for merges and data sync when using GraphLinksModel
        // positive keys for nodes
        makeUniqueKeyFunction: (m: go.Model, data: any) => {
          let k = data.key || 1;
          while (m.findNodeDataForKey(k)) k++;
          data.key = k;
          return k;
        },
        // negative keys for links
        makeUniqueLinkKeyFunction: (m: go.GraphLinksModel, data: any) => {
          let k = data.key || -1;
          while (m.findLinkDataForKey(k)) k--;
          data.key = k;
          return k;
        },
      }),
    });

    diagram.nodeTemplateMap.add(
      "database",
      $(
        go.Node,
        "Auto", // the Shape will go around the TextBlock
        new go.Binding("location", "loc", go.Point.parse).makeTwoWay(
          go.Point.stringify
        ),
        $(
          go.Shape,
          "Database",
          {
            name: "SHAPE",
            fill: "white",
            strokeWidth: 0,
            // set the port properties:
            portId: "",
            fromLinkable: true,
            toLinkable: true,
            cursor: "pointer",
          },
          // Shape.fill is bound to Node.data.color
          new go.Binding("fill", "color")
        ),
        $(
          go.TextBlock,
          { margin: 8, editable: true, font: "400 .875rem Roboto, sans-serif" }, // some room around the text
          new go.Binding("text").makeTwoWay()
        )
      )
    );

    // define a simple Node template
    diagram.nodeTemplate = $(
      go.Node,
      "Auto", // the Shape will go around the TextBlock
      new go.Binding("location", "loc", go.Point.parse).makeTwoWay(
        go.Point.stringify
      ),
      $(
        go.Shape,
        "RoundedRectangle",
        {
          name: "SHAPE",
          fill: "white",
          strokeWidth: 0,
          // set the port properties:
          portId: "",
          fromLinkable: true,
          toLinkable: true,
          cursor: "pointer",
        },
        // Shape.fill is bound to Node.data.color
        new go.Binding("fill", "color")
      ),
      $(
        go.TextBlock,
        { margin: 8, editable: true, font: "400 .875rem Roboto, sans-serif" }, // some room around the text
        new go.Binding("text").makeTwoWay()
      )
    );

    // relinking depends on modelData
    diagram.linkTemplate = $(
      go.Link,
      new go.Binding("relinkableFrom", "canRelink").ofModel(),
      new go.Binding("relinkableTo", "canRelink").ofModel(),
      $(go.Shape),
      $(go.Shape, { toArrow: "Standard" })
    );

    return diagram;
  }

  public render() {
    return (
      <ReactDiagram
        ref={this.diagramRef}
        divClassName="diagram-component"
        initDiagram={this.initDiagram}
        nodeDataArray={this.props.nodeDataArray}
        linkDataArray={this.props.linkDataArray}
        modelData={this.props.modelData}
        onModelChange={this.props.onModelChange}
        skipsDiagramUpdate={this.props.skipsDiagramUpdate}
      />
    );
  }
}

function addDatabaseShape(): void {
  const KAPPA = 4 * ((Math.sqrt(2) - 1) / 3);
  go.Shape.defineFigureGenerator("Database", (shape, w, h) => {
    const geo = new go.Geometry();
    const cpxOffset = KAPPA * 0.5;
    const cpyOffset = KAPPA * 0.1;
    const fig = new go.PathFigure(w, 0.1 * h, true);
    geo.add(fig);

    // Body
    fig.add(new go.PathSegment(go.PathSegment.Line, w, 0.9 * h));
    fig.add(
      new go.PathSegment(
        go.PathSegment.Bezier,
        0.5 * w,
        h,
        w,
        (0.9 + cpyOffset) * h,
        (0.5 + cpxOffset) * w,
        h
      )
    );
    fig.add(
      new go.PathSegment(
        go.PathSegment.Bezier,
        0,
        0.9 * h,
        (0.5 - cpxOffset) * w,
        h,
        0,
        (0.9 + cpyOffset) * h
      )
    );
    fig.add(new go.PathSegment(go.PathSegment.Line, 0, 0.1 * h));
    fig.add(
      new go.PathSegment(
        go.PathSegment.Bezier,
        0.5 * w,
        0,
        0,
        (0.1 - cpyOffset) * h,
        (0.5 - cpxOffset) * w,
        0
      )
    );
    fig.add(
      new go.PathSegment(
        go.PathSegment.Bezier,
        w,
        0.1 * h,
        (0.5 + cpxOffset) * w,
        0,
        w,
        (0.1 - cpyOffset) * h
      )
    );
    const fig2 = new go.PathFigure(w, 0.1 * h, false);
    geo.add(fig2);
    // Rings
    fig2.add(
      new go.PathSegment(
        go.PathSegment.Bezier,
        0.5 * w,
        0.2 * h,
        w,
        (0.1 + cpyOffset) * h,
        (0.5 + cpxOffset) * w,
        0.2 * h
      )
    );
    fig2.add(
      new go.PathSegment(
        go.PathSegment.Bezier,
        0,
        0.1 * h,
        (0.5 - cpxOffset) * w,
        0.2 * h,
        0,
        (0.1 + cpyOffset) * h
      )
    );
    fig2.add(new go.PathSegment(go.PathSegment.Move, w, 0.2 * h));
    fig2.add(
      new go.PathSegment(
        go.PathSegment.Bezier,
        0.5 * w,
        0.3 * h,
        w,
        (0.2 + cpyOffset) * h,
        (0.5 + cpxOffset) * w,
        0.3 * h
      )
    );
    fig2.add(
      new go.PathSegment(
        go.PathSegment.Bezier,
        0,
        0.2 * h,
        (0.5 - cpxOffset) * w,
        0.3 * h,
        0,
        (0.2 + cpyOffset) * h
      )
    );
    fig2.add(new go.PathSegment(go.PathSegment.Move, w, 0.3 * h));
    fig2.add(
      new go.PathSegment(
        go.PathSegment.Bezier,
        0.5 * w,
        0.4 * h,
        w,
        (0.3 + cpyOffset) * h,
        (0.5 + cpxOffset) * w,
        0.4 * h
      )
    );
    fig2.add(
      new go.PathSegment(
        go.PathSegment.Bezier,
        0,
        0.3 * h,
        (0.5 - cpxOffset) * w,
        0.4 * h,
        0,
        (0.3 + cpyOffset) * h
      )
    );
    geo.spot1 = new go.Spot(0, 0.4);
    geo.spot2 = new go.Spot(1, 0.9);
    return geo;
  });
}
