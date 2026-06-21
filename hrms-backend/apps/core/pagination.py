# Standard pagination configuration - 20 items per page by default
# Override with ?page_size= query parameter
from rest_framework.pagination import PageNumberPagination


class StandardResultsPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 500
