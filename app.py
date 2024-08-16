# -*- coding: utf-8 -*-

text = u"Zażółć gęślą jaźń"

from flask import Flask, request, jsonify, render_template, session, send_from_directory
from flask_mysqldb import MySQL
from werkzeug.utils import secure_filename
import os
import smtplib


app = Flask(__name__)

app.config['SECRET_KEY'] = 'your_secret_key'
app.config['UPLOAD_FOLDER'] = 'uploads'

app.config['MYSQL_HOST'] = 'localhost'
app.config['MYSQL_USER'] = 'flaskuser'
app.config['MYSQL_PASSWORD'] = 'haslo'
app.config['MYSQL_DB'] = 'mydatabase'

mysql = MySQL(app)
#-----------------------

def handler(request):
    role = request.json.get('role')
    if role in ['user1', 'user2']:
        return {
            "statusCode": 200,
            "body": "Login successful"
        }
    else:
        return {
            "statusCode": 400,
            "body": "Invalid role"
        }
    
#-----------------------


@app.route('/')
def index():
    if 'role' in session:
        if session['role'] == 'user1':
            return render_template('user1.html')
        elif session['role'] == 'user2':
            return render_template('user2.html')
    return render_template('login.html')

@app.route('/login.html')
def login_page():
    return render_template('login.html')
#-----------------------
@app.route('/login', methods=['POST'])
def login():
    role = request.form.get('role')
    email = request.form.get('email')
    name = request.form.get('name')

    if role not in ['user1', 'user2']:
        return jsonify({'message': 'Invalid role'}), 400

    session['role'] = role

    return jsonify({'message': 'Login successful!'})

#-----------------------


    


@app.route('/logout')
def logout():
    session.pop('role', None)
    return jsonify({'message': 'Wylogowano!'})

#-----------------------


@app.route('/add_task', methods=['POST'])
def add_task():
    if 'role' not in session or session['role'] != 'user1':
        return jsonify({'message': 'Unauthorized'}), 403

    data = request.get_json()
    title = data.get('title')
    description = data.get('description')
    photo_url = data.get('photo_url')
    date = data.get('date')
    endline = data.get('endline')
    validated_date=data.get('validated_date')

    if not title or not description:
        return jsonify({'message': 'Title and description are required!'}), 400

    try:
        cursor = mysql.connection.cursor()
        cursor.execute("INSERT INTO tasks (title, description, photo_url, date, endline, validated_date) VALUES (%s, %s, %s, %s, %s,%s)",
                       (title, description, photo_url, date, endline,validated_date))
        mysql.connection.commit()
        cursor.close()


        # EMAIL DO UZYTKOWNIK 2:

        send_email('NOWE ZADANIE', f'Zleceniodawca dodal nowe zadanie.\n {'- '*30}  \n TUTUL: {title} \n OPIS: {description} \n CZAS WYKONANIA: {endline.replace('T',' ')} \n\n {'-_-'*10}\n POWODZENIA! ;)') 



        return jsonify({'message': 'Task added successfully!'})
    except Exception as e:
        return jsonify({'message': str(e)}), 500
#-----------------------

@app.route('/tasks', methods=['GET'])
def get_tasks():
    try:
        cursor = mysql.connection.cursor()
        cursor.execute("SELECT * FROM tasks")
        tasks = cursor.fetchall()
        cursor.close()

        tasks_list = []
        for task in tasks:
            tasks_list.append({
                'id': task[0],
                'title': task[1],
                'description': task[2],
                'photo_url': task[3],
                'is_validated': task[4],
                'date':task[5],
                'endline':task[6],
                'validated_date':task[7]
            })

        return jsonify(tasks_list)
    except Exception as e:
        return jsonify({'message': str(e)}), 500
    
#-----------------------

@app.route('/task/<int:task_id>/upload_image', methods=['POST'])
def upload_image(task_id):
    if 'role' not in session or session['role'] != 'user2':
        return jsonify({'message': 'Unauthorized'}), 403
    if 'file' not in request.files:
        return jsonify({'message': 'No file part'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'message': 'No selected file'}), 400

    if file:
        filename = secure_filename(file.filename)
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)

        try:
            photo_url = f'/uploads/{filename}'
            cursor = mysql.connection.cursor()
            cursor.execute("UPDATE tasks SET photo_url=%s WHERE id=%s",
                           (photo_url, task_id))
            

            # EMAIL DO UZYTKOWNIK 1: 

            cursor.execute("SELECT title, description FROM tasks WHERE id=%s", (task_id,))
            task = cursor.fetchone()

            mysql.connection.commit()
            cursor.close()

            title,description=task
            print(task)

            send_email('WYKONAWCA WYKONAL ZADANIE', f'Zadanie nr: {task_id}.\n {'- '*30}  \n TUTUL: {title} \n OPIS: {description} \n \n\n {'-_-'*10}\n CZAS NA OCENE! ;)') 
            
            
           
            return jsonify({'message': 'Dodano zdjęcie!'})
        except Exception as e:
            return jsonify({'message': str(e)}), 500

        
#-----------------------


@app.route('/task/<int:task_id>/validate', methods=['PUT'])
def validate_task(task_id):
    if 'role' not in session or session['role'] != 'user1':
        return jsonify({'message': 'Unauthorized'}), 403
    data = request.get_json()
    status = data.get('is_validated')
    status_date = data.get('validated_date')
    message = data.get('message')

    try:
        cursor = mysql.connection.cursor()
        cursor.execute("UPDATE tasks SET is_validated=%s, validated_date=%s WHERE id=%s",
                       (status, status_date, task_id))
        

        cursor.execute("UPDATE tasks SET validated_date=%s WHERE id=%s",(status_date,task_id))

       
        cursor.execute("SELECT title, description, is_validated FROM tasks WHERE id=%s", (task_id,))
        task = cursor.fetchone()
        print(task)

        

        mysql.connection.commit()
        cursor.close()

        # EMAIL DO UZYTKOWNIK 2:
        title,description,is_validated=task
        send_email('OCENA ZADANIA', f'Zleceniodawca {'potwierdzil' if is_validated == 1 else 'odrzucil'} wykonane zadanie \n\n ZADANIE nr: {task_id} \n TUTUL: {title} \n OPIS: {description} \n {'='*30} \n UWAGI OD ZLECENIODAWNY: {message}')  


        return jsonify({'message': 'Zadanie zaaktualizowane!'})
    except Exception as e:
        return jsonify({'message': str(e)}), 500


#-----------------------


@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

#-----------------------

# EMAILE: 

def send_email(subject_txt,message_txt):

    import smtplib

    your_email='lauraladynska123@gmail.com'
    my_email='hazlo8main@gmail.com'
    subject=subject_txt
    message=message_txt

    text=f'Subject: {subject} \n\n{message}'

    server= smtplib.SMTP('smtp.gmail.com',587)
    server.starttls()

    server.login(my_email,'dkmagbrdjcmexapv')

    server.sendmail(my_email,your_email,text)

    print('wyslano email do '+ your_email)

#-----------------------

# PRZYPOMNIENIA O ZADANIACH

def tasks_remember():
    pass


#-----------------------


@app.route('/img/<path:filename>')
def serve_image(filename):
    return send_from_directory('img', filename)


if __name__ == '__main__':
    app.run(debug=True)
