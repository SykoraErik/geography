# -*- coding: utf-8 -*-
from django.http import HttpResponse
from django.utils import simplejson
from random import randint
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login, logout
import os
from django.db.models import F

from lazysignup.decorators import allow_lazy_user
from lazysignup.utils import is_lazy_user

from core.models import Place
from core.models import Answer 
from core.models import Student 
from core.models import UsersPlace 

class JsonResponse(HttpResponse):
    """
        JSON response
    """
    def __init__(self, content, mimetype='application/json', status=None, content_type=None):
        super(JsonResponse, self).__init__(
            content=simplejson.dumps(content),
            mimetype=mimetype,
            status=status,
            content_type=content_type,
        )

class QuestionService():

    def __init__(self, user):
        self.user = user

    def questionFromPlace(self, place, type):
        questionTypes = [
                u"Vyber na mapě stát",
                u"Jak se jmenuje stát zvýrazněný na mapě?"
            ]
        question = {
            'type' : type,
            'text' : questionTypes[type], 
            'place' :  place.name,
            'code' : place.code
        }
        return question

    def getQuestions(self, n):
        places = self.getWeakPlaces(n)

        remains = n - len(places) 
        if (remains > 0):
            places +=  self.getNewPlaces(remains)

        remains = n - len(places) 
        if (remains > 0):
            places +=  self.getRandomPlaces(remains)

        questions = []
        for place in places:
            type = randint(0,1)
            questions.append(self.questionFromPlace(place, type))
        return questions

    def getNewPlaces(self, n):
        return [up.place for up in UsersPlace.objects.filter(user=self.user).order_by('?')[:n]]

    def getWeakPlaces(self, n):
        return [up.place for up in UsersPlace.objects.filter(
                user=self.user, 
                askedCount__gt=F('correctlyAnsweredCount'),
            ).order_by('?')[:n]]

    def getRandomPlaces(self, n):
        return Place.objects.all().order_by('?')[:n]

    def answer(self, a):
        student = Student.fromUser(self.user)
        place = Place.objects.get(code = a["code"])
        answerPlace = Place.objects.get(code = a["answer"]) if a["answer"] != "" else None
        Answer(
            user = student, 
            place = place,
            answer = answerPlace,
            type = a["type"],
            msResposeTime = a["msResponseTime"] 
        ).save()

        student.points += 1;
        student.save();

        usersPlace = UsersPlace.fromStudentAndPlace(student, place)
        usersPlace.askedCount += 1
        if (place == answerPlace):
            usersPlace.correctlyAnsweredCount += 1
        usersPlace.save()

# Create your views here.
def places(request):
    ps = Place.objects.all()
    response = [{
        'name': u'Státy',
        'places': []
    }]
    for p in ps:
        response[0]['places'].append({
          'code' : p.code,
          'name' : p.name
        })
    return JsonResponse(response)

@allow_lazy_user
def users_places(request):
    student = Student.fromUser(request.user)
    ps = UsersPlace.objects.filter(user=student)
    response = [{
        'name': u'Státy',
        'places': []
    }]
    for p in ps:
        response[0]['places'].append({
          'code' : p.place.code,
          'name' : p.place.name,
          'skill' : p.skill(),
        })
    return JsonResponse(response)

@allow_lazy_user
def question(request):
    qs = QuestionService(user = request.user)
    if (request.raw_post_data != ""):
        answer = simplejson.loads(request.raw_post_data)
        qs.answer(answer);

    response = qs.getQuestions(10)
    return JsonResponse(response)

@allow_lazy_user
def user_view(request):
    student = Student.fromUser(request.user)
    isRegistredUser = not is_lazy_user(request.user)
    username = student.user.username if isRegistredUser else ''
    response = {
        'username' : username,
        'points' :  student.points,
    }
    return JsonResponse(response)

def login_view(request):
    if (request.raw_post_data != ""):
        credentials = simplejson.loads(request.raw_post_data)
        user = authenticate(
            username=credentials["username"], 
            password=credentials["password"],
        )
        if user is not None:
            if user.is_active:
                login(request, user)
                # Redirect to a success page.
            #else:
                # Return a 'disabled account' error message
        #else:
            # Return an 'invalid login' error message.
    return user_view(request)
    
def logout_view(request):
    logout(request)
    return user_view(request)
    

def updateStates_view(request):
    if (Place.objects.count() == 0):
        updateStates();
    return HttpResponse("states Updated")

def updateStates():
    Place.objects.all().delete()
    file = open('app-root/runtime/repo/usa.txt')
    states = file.read()
    ss = states.split("\n")
    for s in ss:
       state = s.split("\t")
       if(len(state) > 3):
          name = state[2]
          code = 'us-' + state[0].lower()
          Place(code=code, name = name).save()
