"""Sanitized stand-in for the existing Python Core system.

Consumes command messages from RabbitMQ and emits RunEvents back — a faithful
placeholder for the real Core, which owns the business logic. No real logic here.
"""
