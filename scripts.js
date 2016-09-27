// import DragDropMixin
var DragDropMixin = ReactDND.DragDropMixin;

//one type of component is tasks, so I declare that:
const ItemTypes = {
    TASK: 'task'
};

// define the Task component
// dragging it from task list to task list with DragDropMixin
// implement beginDrag function, register it with ReactDND
// whenever the task is dragged, I carry the task's text and deletion callback along with it
var Task = React.createClass({
    mixins: [DragDropMixin],

    statics: {
        configureDragDrop: function(register) {
            register(ItemTypes.TASK, {
                dragSource: {
                    beginDrag: function(component) {
                        return {
                            item: {
                                text: component.props.text,
                                deleteTask: component.props.deleteTask
                            }
                        };
                    }
                }
            });
        }
    },

    render: function() {
        return (
            <li className="task"
            {...this.dragSourceFor(ItemTypes.TASK)}>
            {this.props.text}
            <span className="delete"
                  onClick={this.props.deleteTask} />
            </li>
        );
    }
});

// implement AddTask, sub component of TaskList for adding new tasks to the task list
var AddTask = React.createClass({
    getInitialState: function() {
        return { text: ""};
    },

    handleChange: function(event) {
        this.setState({text: event.target.value});
    },

    render: function() {
        return (
            <div className="add-task">
                <input type="text"
                       value={this.handleChange} />
                <button type="button" onClick={this.props.addTask.bind(null, this.state.text)}>
                    Add
                </button>
            </div>
        );
    }
});


// TaskDropBin is the component in a TaskList
// acceptDrop function takes a component and an item, which is a JavasScipt object representing the data being dragged
var TaskDropBin = React.createClass({
    mixins: [DragDropMixin],

    statics: {
        configureDragDrop: function(register) {
            register(ItemTypes.TASK, {
                dropTarget: {
                    acceptDrop: function(component, item) {
                        // when a task is dropped add it to the parent task list
                        item.deleteTask();
                        component.props.list.addTask(item.text);
                    }
                }
            });
        }
    },

    render: function() {
        const dropState = this.getDropState(ItemTypes.TASK);

        var stateClass = 'none';
        if (dropState.isHovering) {
            stateClass = 'hovering';

        } else if (dropState.isDragging) {
            stateClass = 'dragging';
        }

        return <div className={"drop drop-state-" + stateClass}
                    {...this.dropTargetFor(ItemTypes.TASK)}>
                Drop here
               </div>;
    }
});


// task list itself
// since it holds a list of tasks which can be deleted, and to which new ones can be added, we make that a big of state

var TaskList = React.createClass({
    getInitialState: function() {
        return { tasks: this.props.tasks };
    },
    deleteTask: function(id) {
        var self = this;
        $.ajax({
            url: '/api/'+this.props.id + '/task/' +id,
            type: 'DELETE',
            success: function(result) {
                var tasks = self.state.tasks;
                tasks.splice(id, 1);
                self.setState({ tasks:tasks});
            }
        });
    },

    addTask: function(text) {
        var self = this;
        $.ajax({
            url: '/api/' + this.props.id + '/task',
            type: 'PUT',
            data: { 'text': text},
            success: function(result) {
                self.setState({ tasks: self.state.tasks.concat([{ text: text}]) });
            }
        });
    },

    render: function() {
        var self = this;
        var task_list = this.state.tasks.map(function(task, index) {
            return (
                <Task key={index}
                      text={task.text}
                      deleteTask={self.deleteTask.bind(self, index)} />
            );
        });
        return (
            <div className="task-list">
                <h1 className="list-title">
                  {this.props.name}
                </h1>
                <ul className="list-tasks">
                  {task_list}
                </ul>
                <TaskDropBin list={this} />
                <AddTask addTask={self.addTask} />
            </div>
        );
    }
});

var App = React.createClass({
    render: function() {
        var lists = this.props.lists.map(function(list, index) {
            return (
                <TaskList key={index}
                          id={index}
                          name={list.name}
                          tasks={list.tasks} />
            );
        });
        return (
            <div className="lists">
              {lists}
            </div>
        );
    }
});


$(document).ready(function() {
    $.getJSON('http://localhost:8000/api/board', function(data) {
        React.render(
            <App lists={data.lists} />,
            document.body
        );
    });
});
