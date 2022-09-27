from flask import (
    Blueprint, flash, g, redirect, render_template, request, url_for, jsonify
)
from werkzeug.exceptions import abort

from wordle.auth import login_required
from wordle.db import get_db
import statistics
from datetime import datetime
from math import log10, floor


bp = Blueprint('game', __name__)


@bp.route('/')
def index():
    return render_template('game/index.html')


@bp.route('/leaderboard', methods=('GET', 'POST'))
def leaderboard():
    db = get_db()
    scores = db.execute(
        'SELECT s.score_id, s.player_id, s.created, s.guesses, s.game_time, s.word, u.username'
        ' FROM scores s JOIN user u ON s.player_id = u.id WHERE s.guesses < 7'
        ' ORDER BY created DESC'
    ).fetchall()

    return render_template('game/leaderboard.html', scores=scores)


@bp.route('/stats', methods=('GET', 'POST'))
def stats(message=""):
    db = get_db()
    player_stats = db.execute(
        'SELECT username, joined, played, wins, losses, streak, longstreak'
        ' FROM user'
        ' ORDER BY joined DESC'
    ).fetchall()

    return render_template('game/stats.html', player_stats=player_stats, message=message)


@bp.route('/morestats')
def morestats():
    user = request.args['user']
    db = get_db()

    # Retrieve player profile stats
    player_stats = db.execute("SELECT s.game_time, s.guesses, u.joined, u.played, u.losses"
                                   " FROM scores s JOIN user u ON s.player_id = u.id"
                                   " WHERE u.username = (?) AND s.guesses < 7", (user,)).fetchall()
    if len(player_stats) > 0:
        # If the player has any data (i.e. they've played at least 1 game)
        # Calculate Career statistics
        player_joined = player_stats[0]['joined'].date()
        account_age = datetime.today() - player_stats[0]['joined']
        if account_age.days > 0:
            account_age = str(account_age).split(',')[0]
        else:
            account_age = str(account_age).split('.')[0]

        total_games = player_stats[0]['played']
        career_stats = [player_joined, account_age, total_games]

        # Calculate user game time statistics
        float_times = [time_to_float(time['game_time']) for time in player_stats]
        avg_time = float_to_timestamp(statistics.mean(float_times))
        min_time = float_to_timestamp(min(float_times))
        max_time = float_to_timestamp(max(float_times))
        total_time = float_to_timestamp(sum(float_times))

        time_stats = [min_time, avg_time, max_time]
        career_stats.append(total_time)

        # Calculate user guesses statistics
        losses = player_stats[0]['losses']
        guesses = [guesses['guesses'] for guesses in player_stats]
        avg_guesses = '{0:.2f}'.format(statistics.mean(guesses))
        total_guesses = sum(guesses) + (losses * 6)
        guess_count = [guesses.count(x + 1) for x in range(6)]
        guess_count.append(losses)

        guess_stats = [avg_guesses, total_guesses, guess_count]

        return render_template('game/morestats.html', user=user, career_stats=career_stats, time_stats=time_stats,
                               guess_stats=guess_stats)
    else:
        message = "There are no stats available for this user"
        return stats(message)


@bp.route('/submitGameInfo', methods=('GET', 'POST'))
@login_required
def submit_game_info():
    if request.method == 'POST':
        word = request.json['word']
        completion_time = request.json['time']
        guesses = request.json['guesses']

        db = get_db()

        db.execute(
            "INSERT INTO scores (word, game_time, guesses, player_id) VALUES (?, ?, ?, ?)",
            (word, completion_time, guesses, g.user['id']),
        )

        if guesses < 7:
            db.execute("UPDATE user SET played = played + 1, wins = wins + 1, streak = streak + 1 WHERE id = (?)", (g.user['id'],))
            db.execute("UPDATE user "
                       "SET longstreak = CASE WHEN streak > longstreak THEN streak ELSE longstreak END "
                       "WHERE id = (?)", (g.user['id'],))
        else:
            db.execute("UPDATE user SET played = played + 1, losses = losses + 1, streak = 0 WHERE id = (?)", (g.user['id'],))

        db.commit()

        return_msg = "game info successfully transferred to database via Python"

        return jsonify(return_msg)


def round_sig(x, sig=2):
    if x == 0:
        return x
    else:
        return round(x, sig-int(floor(log10(abs(x))))-1)


def time_to_float(str_time):
    # Convert str mm:ss:msmsms to float s.ms
    min, sec, ms = str_time.split(":")
    float_time = (int(min) * 60) + int(sec) + (int(ms)/1000)
    return float_time


def float_to_timestamp(float_time):
    # Convert float time to mm:ss:msmsms
    sec, ms = str(float_time).split(".")
    ms = str(round_sig(int(ms), 3))[:3]
    time_stamp = '%02d:%02d:%03d' % (int(sec) / 60, int(sec) % 60, int(ms))
    return time_stamp
