# Wordle-Clone
A wordle clone with some additional functionality, including a timer function to time your games, user accounts to login and store your game data, and leaderboards and stats pages to see your stats and how you compare to other players.

The frontend was developed with JavaScript, HTML, and CSS, and the backend uses the Python-based web framework Flask along with an SQL database.

## Dependencies
- Flask 2.2  
- Python 3.8  

Internet Access is required to access the following JavaScript library CDNs:
- jQuery
- Chart.js
- DataTables

## Setup
Clone this repository onto your machine in the location you'd like to store the app. Navigate to the repository folder and create a virtual environment:
> $ cd ...\wordle-clone  
> $ python3.8 -m venv venv  

Then activate the environment and install Flask:
> $ . venv/bin/activate  
> $ pip install Flask

Now run the following commands to initialize the database and start the app:
> $ flask init-db  
> $ flask --app wordle run

Navigate to http://127.0.0.1:5000 and try out the app.
