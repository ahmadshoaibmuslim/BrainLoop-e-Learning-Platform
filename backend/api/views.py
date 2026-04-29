from django.shortcuts import render, redirect
from rest_framework.views import APIView
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.conf import settings
from django.contrib.auth.hashers import check_password
from django.db import models
from django.db.models.functions import ExtractMonth
from django.core.files.uploadedfile import InMemoryUploadedFile
from .models import MentoringSession
from rest_framework.permissions import IsAuthenticated
from rest_framework import permissions

from django.core.mail import send_mail





from api import serializer as api_serializer
from api import models as api_models
from userauths.models import User, Profile

from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework import generics, status, viewsets
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.response import Response
from rest_framework.decorators import api_view
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from .models import LearningModule
from .serializer import LearningModuleSerializer, LearningModuleAdminSerializer



import random
from decimal import Decimal
import stripe
import requests
from datetime import datetime, timedelta
from distutils.util import strtobool


stripe.api_key = settings.STRIPE_SECRET_KEY
PAYPAL_CLIENT_ID = settings.PAYPAL_CLIENT_ID
PAYPAL_SECRET_ID = settings.PAYPAL_SECRET_ID



# Create your views here.

class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = api_serializer.MyTokenObtainPairSerializer
    

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [AllowAny]
    serializer_class = api_serializer.RegisterSerializer

def generate_random_otp (length=7):
    otp = ''.join([str(random.randint(0,9)) for _ in range(length)])
    return otp

class PasswordResetEmailVerifyAPIView(generics.RetrieveAPIView):
    permission_classes = [AllowAny]
    serializer_class = api_serializer.UserSerializer

    def get_object(self):
        email = self.kwargs['email']

        user = User.objects.filter(email=email).first()
        
        if user: 
            uuidb64 = user.pk
            refresh = RefreshToken.for_user(user)
            refresh_token = str(refresh.access_token)
            
            user.refresh_token = refresh_token
            user.otp = generate_random_otp()
            user.save() 

            link = f"http://localhost:5173/create-new-password/?otp={user.otp}&uuidb64={uuidb64}&refresh_token={refresh_token}"
            merge_data = {
                "link": link,
                "username": user.username
            }
            context = {
                "user": user,
                "reset_url": link,  # Use the actual reset link
            }

            subject = "Password Reset Email"
            text_body = render_to_string("email/password_reset.txt", context)
            html_body = render_to_string("email/password_reset.html", context)

            print(f"Sending email to: {user.email}")
            print(f"Email subject: {subject}")
            print(f"Email text body: {text_body}")
            print(f"Email HTML body: {html_body}")

            msg = EmailMultiAlternatives(
                subject=subject,
                from_email=settings.FROM_EMAIL,
                to=[user.email],
                body=text_body
            )

            msg.attach_alternative(html_body, "text/html")
            
            try:
                msg.send()
                print("Email sent successfully")
            except Exception as e:
                print(f"Failed to send email: {e}")

            print("link ======", link)
            return user



class PasswordChangeAPIView(generics.CreateAPIView):
    permission_classes =[AllowAny]
    serializer_class = api_serializer.UserSerializer

    def create(self, request, *args, **kwargs):
        otp = request.data['otp']
        uuidb64 = request.data['uuidb64']
        password = request.data['password']

        user = User.objects.get(id = uuidb64, otp= otp)
        if user:
            user.set_password(password)
            user.otp = ""
            user.save()

            return Response({"message": "Password Changed Successfully"}, status= status.HTTP_201_CREATED)
        
        else:
            return Response({"message": "User Does Not Exists"}, status= status.HTTP_404_NOT_FOUND)
            
class ChangePasswordAPIView(generics.CreateAPIView):
    serializer_class = api_serializer.UserSerializer
    permission_classes =[AllowAny]

    def create(self, request, *args, **kwargs):
        user_id = request.data['user_id']
        old_password = request.data['old_password']
        new_password = request.data['new_password']


        user = User.objects.get(id = user_id)
        if user is not None:
            if check_password(old_password, user.password):
                user.set_password(new_password)
                user.save()
                return Response({"message": "Password changed successfully", "icon":"success"})
            else:
                return Response({"message": "Old password is incorrect", "icon":"warning"})
        else: 
            return Response({"message": "User does not exist", "icon":"error"})

class ProfileAPIView(generics.RetrieveUpdateAPIView):
    serializer_class = api_serializer.ProfileSerializer
    permission_classes = [AllowAny]

    def get_object(self):
        user_id = self.kwargs['user_id']
        user = User.objects.get(id = user_id) 
        return Profile.objects.get(user = user)

class CategoryListAPIView(generics.ListAPIView):
    queryset = api_models.Category.objects.filter(active=True)
    serializer_class = api_serializer.CategorySerializer
    permission_classes= [AllowAny]


class CourseListAPIView(generics.ListAPIView):
    queryset = api_models.Course.objects.filter(platform_status="Published", teacher_course_status="Published")
    serializer_class = api_serializer.CourseSerializer
    permission_classes = [AllowAny]

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        # Serialize the courses
        serializer = self.serializer_class(queryset, many=True, context={"request": request})
        return Response(serializer.data)



class CourseDetailAPIView(generics.RetrieveAPIView):
    serializer_class = api_serializer.CourseSerializer
    permission_classes= [AllowAny]
    queryset = api_models.Course.objects.filter(platform_status= "Published", teacher_course_status= "Published")


    def get_object(self):
        # This view is called from two URLs:
        # 1. course/course-detail/<slug>/ (public)
        # 2. teacher/course-detail/<course_id>/ (teacher)
        slug = self.kwargs.get('slug')
        course_id = self.kwargs.get('course_id')
        
        if slug:
            course = api_models.Course.objects.get(slug=slug, platform_status="Published", teacher_course_status="Published")
        elif course_id:
            course = api_models.Course.objects.get(id=course_id)
        else:
            raise ValueError("Either slug or course_id must be provided")
        
        return course
    


class StripeCheckoutAPIView(generics.CreateAPIView):
    serializer_class = api_serializer.CartOrderSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        
        order_oid = self.kwargs['order_oid']
        order = api_models.CartOrder.objects.get(oid=order_oid)

        if not order:
            return Response({"message": "Order Not Found"}, status=status.HTTP_404_NOT_FOUND)
        
        try:
            checkout_session = stripe.checkout.Session.create(
                customer_email = order.email,
                payment_method_types=['card'],
                line_items=[
                    {
                        'price_data': {
                            'currency': 'usd',
                            'product_data': {
                                'name': order.full_name,
                            },
                            'unit_amount': int(order.total * 100)
                        },
                        'quantity': 1
                    }
                ],
                mode='payment',
                success_url=settings.FRONTEND_SITE_URL + '/payment-success/' + order.oid + '?session_id={CHECKOUT_SESSION_ID}',
                cancel_url= settings.FRONTEND_SITE_URL + '/payment-failed/'
            )
            print("checkout_session ====", checkout_session)
            order.stripe_session_id = checkout_session.id

            return redirect(checkout_session.url)
        except stripe.error.StripeError as e:
            return Response({"message": f"Something went wrong when trying to make payment. Error: {str(e)}"})



class CartAPIView(generics.CreateAPIView):
    queryset = api_models.Cart.objects.all()
    serializer_class = api_serializer.CartSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        course_id = request.data.get('course_id', None)
        user_id = request.data.get('user_id', None) 
        price = request.data['price']
        country_name = request.data['country_name']
        cart_id = request.data['cart_id']

        course = api_models.Course.objects.filter(id= course_id).first()

        if user_id:

            user = User.objects.filter(id= user_id).first()

        else:
            user = None

        try:
            country_object = api_models.Country.objects.filter(name= country_name).first()
            country = country_object.name
        except: 
            country_object = api_models.Country.objects.filter(name=country_name).first()
            country = country_object.name if country_object else "United States"


        if country_object:
            tax_rate = country_object.tax_rate / 100

        else:
            tax_rate = 0

        cart = api_models.Cart.objects.filter(cart_id= cart_id, course= course).first()

        if cart:
            cart.course = course
            cart.user = user
            cart.price = price
            cart.tax_fee = Decimal(price or 0) * Decimal(tax_rate or 0)

            cart.country = country
            cart.cart_id = cart_id
            cart.total = Decimal(cart.price) + Decimal(cart.tax_fee)
            cart.save()

            return Response({"message": "Cart Updated Successfully"}, status= status.HTTP_200_OK)

        else:
            cart = api_models.Cart()

            cart.course = course
            cart.user = user
            cart.price = price
            cart.tax_fee = Decimal(price) * Decimal(tax_rate)
            cart.country = country
            cart.cart_id = cart_id
            cart.total = Decimal(cart.tax_fee) + Decimal(cart.price)
            cart.save()

            return Response({"message": "Cart Created Successfully"}, status= status.HTTP_200_OK)


class CartListAPIView(generics.ListAPIView):
    serializer_class = api_serializer.CartSerializer
    permission_classes = [AllowAny]


    def get_queryset(self):
        cart_id = self.kwargs['cart_id']
        queryset = api_models.Cart.objects.filter(cart_id= cart_id)
        return queryset
    
class CartItemDeleteAPIView(generics.DestroyAPIView):
    serializer_class = api_serializer.CartSerializer
    permission_classes = [AllowAny]

    def get_object(self):
        cart_id = self.kwargs['cart_id']
        item_id = self.kwargs['item_id']

        return api_models.Cart.objects.filter(cart_id= cart_id, id= item_id).first()
    

class CartStatsAPIView(generics.RetrieveAPIView):
    serializer_class = api_serializer.CartSerializer
    permission_classes = [AllowAny]
    lookup_fields = 'cart_id'

    def get_queryset(self):
        cart_id = self.kwargs['cart_id']
        queryset = api_models.Cart.objects.filter(cart_id= cart_id)
        return queryset
    
    def get(self, request, *args, **kwargs):
        queryset = self.get_queryset()

        total_price = 0.00
        total_tax = 0.00
        total_total = 0.00

        for cart_item in queryset:
            total_price += float(self.calculate_price(cart_item))
            total_tax += float(self.calculate_tax(cart_item))
            total_total += round(float(self.calculate_total(cart_item)), 2)
        
        data = {
            "price": total_price,
            "tax": total_tax,
            "total": total_total
        }
        return Response(data)
    def calculate_price(self, cart_item):
        return cart_item.price
    
    def calculate_tax(self, cart_item):
        return cart_item.tax_fee
    
    def calculate_total(self, cart_item):
        return cart_item.total
    
class CreateOrderAPIView(generics.CreateAPIView):
    serializer_class = api_serializer.CartOrderSerializer
    permission_classes = [AllowAny]
    queryset = api_models.CartOrder.objects.all()

    def create(self, request, *args, **kwargs):
        full_name = request.data['full_name']
        email = request.data['email']
        country = request.data['country']
        cart_id = request.data['cart_id']
        user_id = request.data['user_id']


        user = User.objects.filter(id=int(user_id)).first() if user_id and user_id.isdigit() else None


        cart_items = api_models.Cart.objects.filter(cart_id= cart_id)

        total_price = Decimal(0.00)
        total_tax = Decimal(0.00)
        total_initial_total = Decimal(0.00)
        total_total = Decimal(0.00)

        order = api_models.CartOrder.objects.create(
            full_name = full_name,
            email = email,
            country = country,
            student = user
        )

        for c in cart_items:
            api_models.CartOrderItem.objects.create(
                order=order,
                course=c.course,  # Correct field name
                tax_fee=c.tax_fee,
                total=c.total,    # Correct field name
                 initial_total=c.total,
                teacher=c.course.teacher,
                 saved=0.00,  # Provide a value for the `saved` field if required
                applied_coupon=False  # Or set it appropriately
            )

            total_price += Decimal(c.price)
            total_tax += Decimal(c.tax_fee)
            total_initial_total += Decimal(c.total)
            total_total += Decimal(c.total)

            order.teachers.add(c.course.teacher)

        order.sub_total = total_price
        order.tax_fee = total_tax
        order.initial_total = total_initial_total
        order.total = total_total   
        order.save()
        print("Debug Order OID:", order.oid)  # Debugging
        # return Response({"message": "Order created successfully",}, status=status.HTTP_201_CREATED)
        return Response({"message": "Order created successfully", "order_oid": order.oid}, status = status.HTTP_201_CREATED)


class CheckoutAPIView(generics.RetrieveAPIView):
    serializer_class = api_serializer.CartOrderSerializer
    permission_classes = [AllowAny]
    queryset = api_models.CartOrder.objects.all()
    lookup_field = 'oid'



class StudentSummaryAPIView(generics.ListAPIView):
    serializer_class = api_serializer.StudentSummarySerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        user_id = self.kwargs['user_id']
        user = User.objects.get(id=user_id)

        total_courses = api_models.EnrolledCourse.objects.filter(user=user).count()
        completed_lessons = api_models.CompletedLesson.objects.filter(user=user).count()
        achieved_certificates = api_models.Certificate.objects.filter(user=user).count()

        return [{
            "total_courses": total_courses,
            "completed_lessons": completed_lessons,
            "achieved_certificates": achieved_certificates,
        }]
    
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    


class CouponApplyAPIView(generics.CreateAPIView):
    serializer_class = api_serializer.CouponSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        order_oid = request.data['order_id']
        coupon_code = request.data['coupon_code']

        order = api_models.CartOrder.objects.get(oid = order_oid)
        coupon = api_models.Coupon.objects.get(code = coupon_code)

        if coupon: 
            order_items = api_models.CartOrderItem.objects.filter(order = order, teacher = coupon.teacher)
            for i in order_items:
                if not coupon in i.coupons.all():
                    discount = i.total * coupon.discount /100
                    i.total -= discount
                    i.price -= discount
                    i.saved += discount
                    i.applied_coupon = True
                    i.coupons.add(coupon)

                    order.coupons.add(coupon)
                    order.total -= discount
                    order.sub_total -= discount
                    order.saved += discount

                    i.save()
                    order.save()
                    coupon.used_by.add(order.student)
                    
                    return Response({"message": "Coupon Found and Activated"}, status = status.HTTP_201_CREATED)
                else:
                    return Response({"message": "Coupon Already Applied"}, status = status.HTTP_200_OK)
                    
        
        else:
            return Response({"message": "Coupon Not Found"}, status = status.HTTP_404_NOT_FOUND)
        

# class StripeCheckoutAPIView(generics.CreateAPIView):
#     serializer_class = api_serializer.CartOrderSerializer
#     permission_classes = [AllowAny]

#     def create(self, request, *args, **kwargs):

#         order_oid = self.kwargs['order_oid']
#         order = api_models.CartOrder.objects.gt(oid= order_oid)

#         if not order:
#             return Response({"message": "Order not found"}, status=status.HTTP_404_NOT_FOUND)
        
#         try:
#             checkout_session = stripe.checkout.Session.create(
#                 customer_email= order.email,
#                 payment_method_type = ['card'],
#                 line_items = [
#                     {
#                         "price_data": {
#                             'currency': 'usd',
#                             'product_data': {
#                                 'name': order.full_name,
#                             },
#                             'unit_amount': int(order.total * 100)
#                         },
#                         'quantity':1
#                     }
#                 ],
#                 mode = 'payment'
#                 suceess_url = settings.FRONTEND_SITE_URL + 'payment-success/' + order_oid + '?session_id={CHECKOUT_SESSION_ID}'
#                 cancel_url = settings.FRONTEND_SITE_URL + 'payment-failed/'
#             )
#             order.stripe_session_id = checkout_session.id

#             return redirect(checkout_session.url)
#         except stripe.errors.StripeError as e:
#             return Response({"message": f"Something went wrong when trying to make payment. Error: {str(e)}"})


def get_access_token(client_id, secret_key):
    token_url = "https://api.sandbox.paypal.com/v1/oauth2/token"
    data = {'grant_type': 'client_credientials'}
    auth = (client_id, secret_key)

    response = requests.post(token_url, data=data, auth=auth)

    if response.status_code == 200:
        print("Access Token ===",  response.json()['access_token'])
        return response.json()['access_token']

    else:
        raise Exception("Failed to get access token from paypal {response.status_code}")


        
class StudentCourseCompletedCreateAPIView(generics.CreateAPIView):
    serializer_class = api_serializer.CompletedLessonSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        user_id = request.data['user_id']
        course_id = request.data['course_id']
        variant_item_id = request.data['variant_item_id']

        user = User.objects.get(id=user_id)
        course = api_models.Course.objects.get(id=course_id)
        variant_item = api_models.VariantItem.objects.get(variant_item_id=variant_item_id)

        completed_lessons = api_models.CompletedLesson.objects.filter(user=user, course=course, variant_item=variant_item).first()

        if completed_lessons:
            completed_lessons.delete()
            return Response({"message": "Course marked as not completed"})

        else:
            api_models.CompletedLesson.objects.create(user=user, course=course, variant_item=variant_item)
            return Response({"message": "Course marked as completed"})
        




class StudentNoteCreateAPIView(generics.ListCreateAPIView):
    serializer_class = api_serializer.NoteSerializer
    permission_classes = [AllowAny]
    

    def get_queryset(self):
        user_id = self.kwargs['user_id']
        enrollment_id = self.kwargs['enrollment_id']

        user = User.objects.get(id=user_id)
        enrolled = api_models.EnrolledCourse.objects.get(enrollment_id=enrollment_id)
        
        return api_models.Note.objects.filter(user=user, course=enrolled.course)

    def create(self, request, *args, **kwargs):
        user_id = request.data.get('user_id')
        enrollment_id = request.data.get('enrollment_id')

        if not user_id or user_id == "0":
            return Response({"error": "Invalid user ID"}, status=400)
        

        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({"error": "User does not exist"}, status=status.HTTP_404_NOT_FOUND)

        enrolled = api_models.EnrolledCourse.objects.get(enrollment_id=enrollment_id)
        title = request.data.get('title', '')
        note = request.data.get('note', '')

        api_models.Note.objects.create(user=user, course=enrolled.course, note=note, title=title)
        return Response({"message": "Note created successfully"}, status=status.HTTP_201_CREATED)

     
class PaymentSuccessAPIView(generics.CreateAPIView):
    serializer_class = api_serializer.CartOrderSerializer
    queryset = api_models.CartOrder.objects.all()

    def create(self, request, *args, **kwargs):
        # Extract parameters
        order_oid = request.data.get('order_oid', None)
        paypal_order_id = request.data.get('paypal_order_id', None)

        # Validate parameters
        if not order_oid or not paypal_order_id:
            return Response({"message": "Missing required parameters"}, status=400)

        try:
            order = api_models.CartOrder.objects.get(oid=order_oid)
        except api_models.CartOrder.DoesNotExist:
            return Response({"message": "Order does not exist"}, status=404)

        order_items = api_models.CartOrderItem.objects.filter(order=order)

        # PayPal Payment Processing
        if paypal_order_id != "null":
            paypal_api_url = f"https://api-m.sandbox.paypal.com/v2/checkout/orders/{paypal_order_id}"
            headers = {
                'Content-Type': 'application/json',
                'Authorization': f"Bearer {get_access_token(PAYPAL_CLIENT_ID, PAYPAL_SECRET_ID)}"
            }

            try:
                response = requests.get(paypal_api_url, headers=headers)
                response.raise_for_status()
                paypal_order_data = response.json()
                paypal_payment_status = paypal_order_data['status']
            except requests.exceptions.RequestException as e:
                return Response({"message": f"An error occurred with PayPal API: {str(e)}"}, status=500)

            # Check PayPal payment status
            if paypal_payment_status == "COMPLETED":
                if order.payment_status == "Processing":
                    order.payment_status = "Paid"
                    order.save()

                    api_models.Notification.objects.create(user=order.student, order=order, type="Course Enrollment Completed")

                    for i in order_items:
                        api_models.Notification.objects.create(
                            teacher=i.teacher,
                            order=order,
                            order_item=i,
                            type="New Order",
                        )
                        api_models.EnrolledCourse.objects.create(
                            course=i.course,
                            user=order.student,
                            teacher=i.teacher,
                            order_item=i,
                        )
                    return Response({"message": "Payment Successful"})
                else:
                    return Response({"message": "You have already paid, Thanks"})
            else:
                return Response({"message": "Payment Not Successful"})

        # Return response for missing or invalid payment
        return Response({"message": "Invalid PayPal Order ID"}, status=400)

            

class SearchCourseAPIView(generics.ListAPIView):
    serializer_class = api_serializer.CourseSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        query = self.request.GET.get('query')
        
        return api_models.Course.objects.filter(title__icontains=query, platform_status= "Published", teacher_course_status= "Published")



class StudentNoteDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = api_serializer.NoteSerializer
    permission_classes = [AllowAny]

    def get_object(self):
        user_id = self.kwargs['user_id']
        enrollment_id = self.kwargs['enrollment_id']
        note_id = self.kwargs['note_id']

        user = User.objects.get(id=user_id)
        enrolled = api_models.EnrolledCourse.objects.get(enrollment_id=enrollment_id)
        note = api_models.Note.objects.get(user=user, course=enrolled.course, id=note_id)
        return note

 

class StudentSummeryAPIView(generics.ListAPIView):
    serializer_class = api_serializer.StudentSummerySerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        user_id = self.kwargs['user_id']
        user = User.objects.get(id= user_id)

        total_courses = api_models.EnrolledCourse.objects.filter(user = user).count()
        completed_lesson = api_models.CompletedLesson.objects.filter(user= user).count()
        achieved_certificates = api_models.Certificate.objects.filter(user=user).count()

        return [{
            "total_courses": total_courses,
            "completed_lessons": completed_lesson,
            "achieved_certificates": achieved_certificates,
        }]

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many= True)
        return Response(serializer.data)
    

class StudentCourseListAPIView(generics.ListAPIView):
    serializer_class = api_serializer.EnrolledCourseSerializer
    permission_classes = [AllowAny]


    def get_queryset(self):
        user_id = self.kwargs['user_id']
        user = User.objects.get(id=user_id)

        return api_models.EnrolledCourse.objects.filter(user = user)

class ProfileAPIView(generics.RetrieveUpdateAPIView):
    serializer_class = api_serializer.ProfileSerializer
    permission_classes = [AllowAny]

    def get_object(self):
        user_id = self.kwargs['user_id']
        user = User.objects.get(id=user_id)
        return Profile.objects.get(user=user)



class StudentRateCourseCreateAPIView(generics.CreateAPIView):
    serializer_class = api_serializer.ReviewSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        user_id = request.data['user_id']
        course_id = request.data['course_id']
        rating = request.data['rating']
        review = request.data['review']

        user = User.objects.get(id=user_id)
        course = api_models.Course.objects.get(id=course_id)

        # Verify user is enrolled in the course
        is_enrolled = api_models.EnrolledCourse.objects.filter(
            user=user, 
            course=course
        ).exists()
        
        if not is_enrolled:
            return Response(
                {"detail": "You must be enrolled in this course to leave a review."}, 
                status=status.HTTP_403_FORBIDDEN
            )

        api_models.Review.objects.create(
            user=user,
            course=course,
            review=review,
            rating=rating,
            active=True,
        )

        return Response({"message": "Review created successfullly"}, status=status.HTTP_201_CREATED)


class ChangePasswordAPIView(generics.CreateAPIView):
    serializer_class = api_serializer.UserSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        user_id = request.data['user_id']
        old_password = request.data['old_password']
        new_password = request.data['new_password']

        user = User.objects.get(id=user_id)
        if user is not None:
            if check_password(old_password, user.password):
                user.set_password(new_password)
                user.save()
                return Response({"message": "Password changed successfully", "icon": "success"})
            else:
                return Response({"message": "Old password is incorrect", "icon": "warning"})
        else:
            return Response({"message": "User does not exists", "icon": "error"})

       




class StudentRateCourseUpdateAPIView(generics.RetrieveUpdateAPIView):
    serializer_class = api_serializer.ReviewSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        user_id = self.kwargs['user_id']
        review_id = self.kwargs['review_id']

        user = User.objects.get(id=user_id)
        return api_models.Review.objects.get(id=review_id, user=user)
    


class StudentWishListListCreateAPIView(generics.ListCreateAPIView):
    serializer_class = api_serializer.WishlistSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        user_id = self.kwargs['user_id']
        user = User.objects.get(id=user_id)
        return api_models.WishList.objects.filter(user=user)
    
    def create(self, request, *args, **kwargs):
        user_id = request.data['user_id']
        course_id = request.data['course_id']

        user = User.objects.get(id=user_id)
        course = api_models.Course.objects.get(id=course_id)

        wishlist = api_models.WishList.objects.filter(user=user, course=course).first()  
        if wishlist:
            wishlist.delete()
            return Response({"message": "Wishlist Deleted"}, status=status.HTTP_200_OK)
        else:
            api_models.WishList.objects.create(user=user, course=course)  # Correct model name `WishList`
            return Response({"message": "Wishlist Created"}, status=status.HTTP_201_CREATED)


class StudentCourseDetailAPIView(generics.RetrieveAPIView):
    serializer_class = api_serializer.EnrolledCourseSerializer
    permission_classes = [AllowAny]

    lookup_fields = 'enrollment_id'

    def get_object(self):
        user_id = self.kwargs['user_id']
        enrollment_id = self.kwargs['enrollment_id']

        user = User.objects.get(id=user_id)
        return api_models.EnrolledCourse.objects.get(user= user, enrollment_id= enrollment_id)



class QuestionAnswerListCreateAPIView(generics.ListCreateAPIView):
    serializer_class = api_serializer.Question_AnswerSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        course_id = self.kwargs['course_id']
        course = api_models.Course.objects.get(id=course_id)
        return api_models.Question_Answer.objects.filter(course=course)
    
    def create(self, request, *args, **kwargs):
        course_id = request.data['course_id']
        user_id = request.data['user_id']
        title = request.data['title']
        message = request.data['message']

        user = User.objects.get(id=user_id)
        course = api_models.Course.objects.get(id=course_id)
        
        question = api_models.Question_Answer.objects.create(
            course=course,
            user=user,
            title=title
        )

        api_models.Question_Answer_Message.objects.create(
            course=course,
            user=user,
            message=message,
            question=question
        )
        
        return Response({"message": "Group conversation Started"}, status=status.HTTP_201_CREATED)


class QuestionAnswerMessageSendAPIView(generics.CreateAPIView):
    serializer_class = api_serializer.Question_Answer_MessageSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        course_id = request.data['course_id']
        qa_id = request.data['qa_id']
        user_id = request.data['user_id']
        message = request.data['message']

        user = User.objects.get(id=user_id)
        course = api_models.Course.objects.get(id=course_id)
        question = api_models.Question_Answer.objects.get(qa_id=qa_id)
        api_models.Question_Answer_Message.objects.create(
            course=course,
            user=user,
            message=message,
            question=question
        )

        question_serializer = api_serializer.Question_AnswerSerializer(question)
        return Response({"messgae": "Message Sent", "question": question_serializer.data})

class TeacherListView(generics.ListAPIView):
    queryset = api_models.Teacher.objects.all()   # ✅ Only show approved instructors
    serializer_class = api_serializer.TeacherSerializer
    permission_classes = [AllowAny]


class TeacherSummaryAPIView(generics.ListAPIView):
    serializer_class = api_serializer.TeacherSummarySerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        teacher_id = self.kwargs['teacher_id']
        teacher = api_models.Teacher.objects.get(id=teacher_id)

        one_month_ago = datetime.today() - timedelta(days=28)

        total_courses = api_models.Course.objects.filter(teacher=teacher).count()
        total_revenue = api_models.CartOrderItem.objects.filter(teacher=teacher, order__payment_status="Paid").aggregate(total_revenue=models.Sum("total"))['total_revenue'] or 0
        monthly_revenue = api_models.CartOrderItem.objects.filter(teacher=teacher, order__payment_status="Paid", date__gte=one_month_ago).aggregate(total_revenue=models.Sum("total"))['total_revenue'] or 0

        enrolled_courses = api_models.EnrolledCourse.objects.filter(teacher=teacher)
        unique_student_ids = set()
        students = []

        for course in enrolled_courses:
            if course.user_id not in unique_student_ids:
                user = User.objects.get(id=course.user_id)
                student = {
                    "full_name": user.profile.full_name,
                    "image": user.profile.image.url,
                    "country": user.profile.country,
                    "date": course.date
                }

                students.append(student)
                unique_student_ids.add(course.user_id)

        return [{
            "total_courses": total_courses,
            "total_revenue": total_revenue,
            "monthly_revenue": monthly_revenue,
            "total_students": len(students),
        }]
    
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    

class TeacherCourseListAPIView(generics.ListAPIView):
    serializer_class = api_serializer.CourseSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        teacher_id = self.kwargs['teacher_id']
        teacher = api_models.Teacher.objects.get(id=teacher_id)
        return api_models.Course.objects.filter(teacher=teacher)
    

class TeacherReviewListAPIView(generics.ListAPIView):
    serializer_class = api_serializer.ReviewSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        teacher_id = self.kwargs['teacher_id']
        teacher = api_models.Teacher.objects.get(id=teacher_id)
        return api_models.Review.objects.filter(course__teacher=teacher)
    

class TeacherReviewDetailAPIView(generics.RetrieveUpdateAPIView):
    serializer_class = api_serializer.ReviewSerializer
    permission_classes = [AllowAny]

    def get_object(self):
        teacher_id = self.kwargs['teacher_id']
        review_id = self.kwargs['review_id']
        teacher = api_models.Teacher.objects.get(id=teacher_id)
        return api_models.Review.objects.get(course__teacher=teacher, id=review_id)
    

class TeacherStudentsListAPIVIew(viewsets.ViewSet):
    
    def list(self, request, teacher_id=None):
        teacher = api_models.Teacher.objects.get(id=teacher_id)

        enrolled_courses = api_models.EnrolledCourse.objects.filter(teacher=teacher)
        unique_student_ids = set()
        students = []

        for course in enrolled_courses:
            if course.user_id not in unique_student_ids:
                user = User.objects.get(id=course.user_id)
                student = {
                    "full_name": user.profile.full_name,
                    "image": user.profile.image.url,
                    "country": user.profile.country,
                    "date": course.date
                }

                students.append(student)
                unique_student_ids.add(course.user_id)

        return Response(students)
    

@api_view(("GET", ))
def TeacherAllMonthEarningAPIView(request, teacher_id):
    teacher = api_models.Teacher.objects.get(id=teacher_id)
    
    print("Checking teacher:", teacher)

    # Fetch all order items for the teacher
    orders = api_models.CartOrderItem.objects.filter(teacher=teacher)
    print("Total orders for teacher:", orders.count())

    # Fetch only paid orders
    paid_orders = orders.filter(order__payment_status="Paid")
    print("Paid orders:", paid_orders.count())

    # Ensure total is not NULL or 0
    valid_orders = paid_orders.exclude(total=None).exclude(total=0)
    print("Valid orders with total:", valid_orders.count())

    # Now, apply aggregation
    monthly_earning_tracker = (
        valid_orders
        .annotate(month=ExtractMonth("date"))
        .values("month")
        .annotate(total_earning=models.Sum("total"))
        .order_by("month")
    )

    print("Final API Response:", list(monthly_earning_tracker))
    
    return Response(monthly_earning_tracker)


    print(list(monthly_earning_tracker))
    return Response(monthly_earning_tracker)

class TeacherBestSellingCourseAPIView(viewsets.ViewSet):

    def list(self, request, teacher_id=None):
        teacher = api_models.Teacher.objects.get(id=teacher_id)
        courses_with_total_price = []
        courses = api_models.Course.objects.filter(teacher=teacher)

        for course in courses:
            revenue = course.enrolledcourse_set.aggregate(total_price=models.Sum('order_item__total'))['total_price'] or 0

            sales = course.enrolledcourse_set.count()

            courses_with_total_price.append({
                'course_image': course.image.url,
                'course_title': course.title,
                'revenue': revenue,
                'sales': sales,
            })

        return Response(courses_with_total_price)
    


class TeacherCourseOrdersListAPIView(generics.ListAPIView):
    serializer_class = api_serializer.CartOrderItemSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        teacher_id = self.kwargs['teacher_id']
        
        try:
            teacher = api_models.Teacher.objects.get(id=teacher_id)
        except api_models.Teacher.DoesNotExist:
            raise Http404("Teacher not found")
        
        return api_models.CartOrderItem.objects.filter(teacher=teacher)


class TeacherQuestionAnswerListAPIView(generics.ListAPIView):
    serializer_class = api_serializer.Question_AnswerSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        teacher_id = self.kwargs['teacher_id']
        teacher = api_models.Teacher.objects.get(id=teacher_id)
        return api_models.Question_Answer.objects.filter(course__teacher=teacher)
    
class TeacherCouponListCreateAPIView(generics.ListCreateAPIView):
    serializer_class = api_serializer.CouponSerializer
    permission_classes = [AllowAny]
    
    def get_queryset(self):
        teacher_id = self.kwargs.get("teacher_id")
        return api_models.Coupon.objects.filter(teacher_id=teacher_id, active=True)

    

class TeacherCouponDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = api_serializer.CouponSerializer
    permission_classes = [AllowAny]
    
    def get_object(self):
        teacher_id = self.kwargs['teacher_id']
        coupon_id = self.kwargs['coupon_id']
        teacher = api_models.Teacher.objects.get(id=teacher_id)
        return api_models.Coupon.objects.get(teacher=teacher, id=coupon_id)
    
class TeacherNotificationListAPIView(generics.ListAPIView):
    serializer_class = api_serializer.NotificationSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        teacher_id = self.kwargs['teacher_id']
        teacher = api_models.Teacher.objects.get(id=teacher_id)
        return api_models.Notification.objects.filter(teacher=teacher, seen=False)
    
class TeacherNotificationDetailAPIView(generics.RetrieveUpdateAPIView):
    serializer_class = api_serializer.NotificationSerializer
    permission_classes = [AllowAny]

    def get_object(self):
        teacher_id = self.kwargs['teacher_id']
        noti_id = self.kwargs['noti_id']
        teacher = api_models.Teacher.objects.get(id=teacher_id)
        return api_models.Notification.objects.get(teacher=teacher, id=noti_id)






class CourseCreateAPIView(generics.CreateAPIView):
    querysect = api_models.Course.objects.all()
    serializer_class = api_serializer.CourseSerializer
    permisscion_classes = [AllowAny]

    def perform_create(self, serializer):
        serializer.is_valid(raise_exception=True)
        course_instance = serializer.save()

        variant_data = []
        for key, value in self.request.data.items():
            if key.startswith('variant') and '[variant_title]' in key:
                index = key.split('[')[1].split(']')[0]
                title = value

                variant_dict = {'title': title}
                item_data_list = []
                current_item = {}
                variant_data = []

                for item_key, item_value in self.request.data.items():
                    if f'variants[{index}][items]' in item_key:
                        field_name = item_key.split('[')[-1].split(']')[0]
                        if field_name == "title":
                            if current_item:
                                item_data_list.append(current_item)
                            current_item = {}
                        current_item.update({field_name: item_value})
                    
                if current_item:
                    item_data_list.append(current_item)

                variant_data.append({'variant_data': variant_dict, 'variant_item_data': item_data_list})

        for data_entry in variant_data:
            variant = api_models.Variant.objects.create(title=data_entry['variant_data']['title'], course=course_instance)

            for item_data in data_entry['variant_item_data']:
                preview_value = item_data.get("preview")
                preview = bool(strtobool(str(preview_value))) if preview_value is not None else False

                api_models.VariantItem.objects.create(
                    variant=variant,
                    title=item_data.get("title"),
                    description=item_data.get("description"),
                    file=item_data.get("file"),
                    preview=preview,
                )

    def save_nested_data(self, course_instance, serializer_class, data):
        serializer = serializer_class(data=data, many=True, context={"course_instance": course_instance})
        serializer.is_valid(raise_exception=True)
        serializer.save(course=course_instance) 



class CourseUpdateAPIView(generics.RetrieveUpdateAPIView):
    querysect = api_models.Course.objects.all()
    serializer_class = api_serializer.CourseSerializer
    permisscion_classes = [AllowAny]

    def get_object(self):
        teacher_id = self.kwargs['teacher_id']
        course_id = self.kwargs['course_id']

        teacher = api_models.Teacher.objects.get(id=teacher_id)
        course = api_models.Course.objects.get(course_id=course_id)

        return course
    
    def update(self, request, *args, **kwargs):
        course = self.get_object()
        serializer = self.get_serializer(course, data=request.data)
        serializer.is_valid(raise_exception=True)

        if "image" in request.data and isinstance(request.data['image'], InMemoryUploadedFile):
            course.image = request.data['image']
        elif 'image' in request.data and str(request.data['image']) == "No File":
            course.image = None
        
        if 'file' in request.data and not str(request.data['file']).startswith("http://"):
            course.file = request.data['file']

        if 'category' in request.data['category'] and request.data['category'] != 'NaN' and request.data['category'] != "undefined":
            category = api_models.Category.objects.get(id=request.data['category'])
            course.category = category

        self.perform_update(serializer)
        self.update_variant(course, request.data)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    def update_variant(self, course, request_data):
        for key, value in request_data.items():
            if key.startswith("variants") and '[variant_title]' in key:

                index = key.split('[')[1].split(']')[0]
                title = value

                id_key = f"variants[{index}][variant_id]"
                variant_id = request_data.get(id_key)

                variant_data = {'title': title}
                item_data_list = []
                current_item = {}

                for item_key, item_value in request_data.items():
                    if f'variants[{index}][items]' in item_key:
                        field_name = item_key.split('[')[-1].split(']')[0]
                        if field_name == "title":
                            if current_item:
                                item_data_list.append(current_item)
                            current_item = {}
                        current_item.update({field_name: item_value})
                    
                if current_item:
                    item_data_list.append(current_item)

                existing_variant = course.variant_set.filter(id=variant_id).first()

                if existing_variant:
                    existing_variant.title = title
                    existing_variant.save()

                    for item_data in item_data_list[1:]:
                        preview_value = item_data.get("preview")
                        preview = bool(strtobool(str(preview_value))) if preview_value is not None else False

                        variant_item = api_models.VariantItem.objects.filter(variant_item_id=item_data.get("variant_item_id")).first()

                        if not str(item_data.get("file")).startswith("http://"):
                            if item_data.get("file") != "null":
                                file = item_data.get("file")
                            else:
                                file = None
                            
                            title = item_data.get("title")
                            description = item_data.get("description")

                            if variant_item:
                                variant_item.title = title
                                variant_item.description = description
                                variant_item.file = file
                                variant_item.preview = preview
                            else:
                                variant_item = api_models.VariantItem.objects.create(
                                    variant=existing_variant,
                                    title=title,
                                    description=description,
                                    file=file,
                                    preview=preview
                                )
                        
                        else:
                            title = item_data.get("title")
                            description = item_data.get("description")

                            if variant_item:
                                variant_item.title = title
                                variant_item.description = description
                                variant_item.preview = preview
                            else:
                                variant_item = api_models.VariantItem.objects.create(
                                    variant=existing_variant,
                                    title=title,
                                    description=description,
                                    preview=preview
                                )
                        
                        variant_item.save()

                else:
                    new_variant = api_models.Variant.objects.create(
                        course=course, title=title
                    )

                    for item_data in item_data_list:
                        preview_value = item_data.get("preview")
                        preview = bool(strtobool(str(preview_value))) if preview_value is not None else False

                        api_models.VariantItem.objects.create(
                            variant=new_variant,
                            title=item_data.get("title"),
                            description=item_data.get("description"),
                            file=item_data.get("file"),
                            preview=preview,
                        )

    def save_nested_data(self, course_instance, serializer_class, data):
        serializer = serializer_class(data=data, many=True, context={"course_instance": course_instance})
        serializer.is_valid(raise_exception=True)
        serializer.save(course=course_instance) 





class CourseVariantDeleteAPIView(generics.DestroyAPIView):
    serializer_class = api_serializer.VariantSerializer
    permission_classes = [AllowAny]

    def get_object(self):
        variant_id = self.kwargs['variant_id']
        teacher_id = self.kwargs['teacher_id']
        course_id = self.kwargs['course_id']

        print("variant_id ========", variant_id)

        teacher = api_models.Teacher.objects.get(id=teacher_id)
        course = api_models.Course.objects.get(teacher=teacher, course_id=course_id)
        return api_models.Variant.objects.get(id=variant_id)


class CourseVariantItemDeleteAPIVIew(generics.DestroyAPIView):
    serializer_class = api_serializer.VariantItemSerializer
    permission_classes = [AllowAny]

    def get_object(self):
        variant_id = self.kwargs['variant_id']
        variant_item_id = self.kwargs['variant_item_id']
        teacher_id = self.kwargs['teacher_id']
        course_id = self.kwargs['course_id']


        teacher = api_models.Teacher.objects.get(id=teacher_id)
        course = api_models.Course.objects.get(teacher=teacher, course_id=course_id)
        variant = api_models.Variant.objects.get(variant_id=variant_id, course=course)
        return api_models.VariantItem.objects.get(variant=variant, variant_item_id=variant_item_id)
    


import logging

logger = logging.getLogger(__name__)

# class MentoringSessionListCreateAPIView(generics.ListCreateAPIView):
#     # queryset = MentoringSession.objects.all()
#     serializer_class = api_serializer.MentoringSessionSerializer
#     permission_classes = [IsAuthenticated]

#     def get_queryset(self):
#         return MentoringSession.objects.filter(student=self.request.user)
    
from rest_framework.permissions import IsAuthenticatedOrReadOnly

class MentoringSessionListView(generics.ListCreateAPIView):
    serializer_class = api_serializer.MentoringSessionSerializer
    permission_classes = [AllowAny]  # Ensure user is authenticated
    
    def get_queryset(self):
        student_id = self.request.query_params.get('student')

        if student_id:
            try:
                return MentoringSession.objects.filter(student_id=int(student_id))
            except (ValueError, TypeError):
                return MentoringSession.objects.none()  # Avoid fallback on user

        # If no student ID is provided, just return all sessions publicly
        return MentoringSession.objects.all()
    
    

class MentoringSessionDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = MentoringSession.objects.all()
    serializer_class = api_serializer.MentoringSessionSerializer
    permission_classes = [AllowAny]

class UpcomingSessionsAPIView(generics.ListAPIView):
    serializer_class = api_serializer.MentoringSessionSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        student_id = self.request.query_params.get('student')
        if student_id:
            return MentoringSession.objects.filter(student_id=student_id, status='upcoming')
        return MentoringSession.objects.none()

class PastSessionsAPIView(generics.ListAPIView):
    serializer_class = api_serializer.MentoringSessionSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):

        student_id = self.request.query_params.get('student')
        if student_id:
            return MentoringSession.objects.filter(student_id=student_id, status='completed')
        return MentoringSession.objects.none()

        user = self.request.user
        return MentoringSession.objects.filter(student=user, status='completed')
    

# Teacher application 
class LearningModuleCreateView(generics.CreateAPIView):
    queryset = LearningModule.objects.all()
    serializer_class = LearningModuleSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)  # ✅ Correct way to set user

class LearningModuleApprovalView(generics.UpdateAPIView):
    queryset = LearningModule.objects.all()
    serializer_class = LearningModuleAdminSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.is_approved = request.data.get("is_approved", instance.is_approved)
        instance.feedback = request.data.get("feedback", instance.feedback)
        instance.save()

        # ✅ Set user as teacher only when approved
        if instance.is_approved:
            user = instance.user
            if not api_models.Teacher.objects.filter(user=user).exists():
                api_models.Teacher.objects.create(user=user, full_name=user.full_name)  # ✅ Create teacher record
            user.teacher_id = instance.id
            user.save()

        return Response({"message": "Approval status updated", "is_approved": instance.is_approved})


@api_view(["GET"])
def check_approval_status(request, module_id):
    try:
        module = LearningModule.objects.get(id=module_id, user=request.user)
        return Response({"is_approved": module.is_approved, "feedback": module.feedback})
    except LearningModule.DoesNotExist:
        return Response({"error": "Module not found"}, status=404)


# Books

# List and Create Books
class BookListCreateView(generics.ListCreateAPIView):
    queryset = api_models.Book.objects.all()
    serializer_class = api_serializer.BookSerializer
    permission_classes = [AllowAny]

    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user)

# Retrieve, Update, and Delete Book
class BookDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = api_models.Book.objects.all()
    serializer_class = api_serializer.BookSerializer
    permission_classes = [AllowAny]

    def get_serializer_context(self):
        return {'request': self.request}


    def get_object(self):
        id = self.kwargs['id']
        book = api_models.Book.objects.get(id= id)
        return book


# Purchase a Book
class BookPurchaseView(generics.CreateAPIView):
    queryset = api_models.BookPurchase.objects.all()
    serializer_class = api_serializer.BookPurchaseSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from .models import Book

# views.py
class BookCreateAPIView(generics.CreateAPIView):
    queryset = Book.objects.all()
    serializer_class = api_serializer.BookSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        print("Authenticated User:", self.request.user)  # Debugging
        serializer.save(uploaded_by=self.request.user)

        
from django.http import JsonResponse
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.feature_extraction.text import TfidfVectorizer
import numpy as np
from .models import Course

def recommend_courses(request, course_id):
    try:
        # Fetch all courses
        courses = Course.objects.all()
        course_data = [{"id": course.id, "title": course.title, "description": course.description, "tags": course.tags} for course in courses]

        # Combine features into a single text field
        for course in course_data:
            course["combined_features"] = f"{course['title']} {course['description']} {course['tags']}"

        # Vectorize the combined features
        vectorizer = TfidfVectorizer(stop_words='english')
        tfidf_matrix = vectorizer.fit_transform([course["combined_features"] for course in course_data])

        # Compute cosine similarity matrix
        cosine_sim = cosine_similarity(tfidf_matrix, tfidf_matrix)

        # Get the index of the course for which recommendations are needed
        course_index = next((i for i, course in enumerate(course_data) if course["id"] == course_id), None)
        if course_index is None:
            return JsonResponse({"error": "Course not found."}, status=404)

        # Get similarity scores for the course
        sim_scores = list(enumerate(cosine_sim[course_index]))

        # Sort courses by similarity score
        sim_scores = sorted(sim_scores, key=lambda x: x[1], reverse=True)

        # Exclude the course itself
        sim_scores = sim_scores[1:]

        # Get the top N recommendations
        top_indices = [i[0] for i in sim_scores[:4]]  # Top 5 recommendations
        top_indices = [int(i) for i in top_indices]  # Convert to Python integers

        # Fetch recommended courses
        recommended_courses = [courses[i] for i in top_indices]

        # Serialize the recommended courses with needed display fields
        recommended_courses_data = []
        for course in recommended_courses:
            image_url = None
            if course.image:
                image_url = request.build_absolute_uri(course.image.url)

            recommended_courses_data.append({
                "id": course.id,
                "title": course.title,
                "slug": course.slug,
                "description": course.description,
                "image": image_url,
                "price": str(course.price),
                "level": course.level,
                "rating": course.average_rating() or 0,
                "reviews": course.rating_count(),
                "students": course.students().count(),
                "instructor": course.teacher.full_name if course.teacher else "Unknown",
            })

        return JsonResponse({"recommended_courses": recommended_courses_data}, status=200)

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)
    

import PyPDF2
from django.http import FileResponse, HttpResponse
from django.shortcuts import get_object_or_404
from io import BytesIO
from .models import Book

def preview_book(request, book_id):
    book = get_object_or_404(Book, id=book_id)

    if not book.pdf_file:
        return HttpResponse("No PDF available", status=404)

    # Open the book PDF
    pdf_reader = PyPDF2.PdfReader(book.pdf_file)
    preview_pages = min(book.preview_pages, len(pdf_reader.pages))  # Limit preview pages

    output_pdf = PyPDF2.PdfWriter()
    
    # Add only the allowed preview pages
    for i in range(preview_pages):
        output_pdf.add_page(pdf_reader.pages[i])

    # Save to memory
    output_stream = BytesIO()
    output_pdf.write(output_stream)
    output_stream.seek(0)

    # Return as a response
    return FileResponse(output_stream, content_type='application/pdf')



from django.shortcuts import get_object_or_404
from django.http import JsonResponse
from .models import Book

from django.conf import settings
from django.urls import reverse

def category_based_recommendations(request, book_id):
    book = get_object_or_404(Book, id=book_id)
    
    # Get books from the same category, excluding the current book
    recommended_books = Book.objects.filter(category=book.category).exclude(id=book.id)[:5]

    # Convert books to JSON format
    data = [
        {
            "id": b.id,
            "title": b.title,
            "author": b.author,
            "price": str(b.price),
            "image": request.build_absolute_uri(b.image.url) if b.image else None,
        }
        for b in recommended_books
    ]
    
    return JsonResponse(data, safe=False)


from rest_framework.decorators import api_view
from rest_framework.response import Response
# from .models import Mentor, MentoringSession

@api_view(['GET'])
def mentor_list(request):
    mentors = api_models.Teacher.objects.all().values('id', 'name', 'expertise')
    return Response(list(mentors))

@api_view(['POST'])
def book_session(request):
    data = request.data
    mentor = api_models.Teacher.objects.get(id=data['id'])
    session = MentoringSession.objects.create(
        mentor=mentor,
        student=request.user,
        date=data['date'],
        time=data['time']
    )
    return Response({"message": "Session booked successfully!"})



import requests
from django.conf import settings
from django.http import JsonResponse
from .models import MentoringSession

def create_meeting_link():
    response = requests.post(
        "https://api.whereby.dev/v1/meetings",
        headers={"Authorization": f"Bearer {settings.WHEREBY_API_KEY}"},
        json={"isLocked": False, "roomName": "mentor-session"}
    )
    return response.json().get("roomUrl")

def book_session(request):
    if request.method == "POST":
        mentor_id = request.POST["mentor"]
        student_id = request.user.id  # Assuming user is logged in
        date = request.POST["date"]
        time = request.POST["time"]

        meeting_link = create_meeting_link()

        session = MentoringSession.objects.create(
            mentor_id=mentor_id, student_id=student_id,
            date=date, time=time, meeting_link=meeting_link
        )

        return JsonResponse({"message": "Session booked!", "meeting_link": meeting_link})
