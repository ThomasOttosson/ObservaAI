from django.urls import path

from .views import (
    chat,
    health,
    history,
    stats,
    export_pdf,
    delete_analysis,
    toggle_favorite,
    register,
    me,
)

urlpatterns = [
    path("health/", health),
    path("chat/", chat),
    path("history/", history),
    path("stats/", stats),

    path(
        "export/<int:analysis_id>/",
        export_pdf,
    ),

    path(
        "delete/<int:analysis_id>/",
        delete_analysis,
    ),

    path(
        "favorite/<int:analysis_id>/",
        toggle_favorite,
    ),

    path(
        "register/",
        register,
    ),

    path(
        "me/",
        me,
    ),
]
