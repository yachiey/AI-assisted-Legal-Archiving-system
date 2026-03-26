"""
Utility to fix common Windows-specific issues when running Python services.
Addresses:
- Windows Error 6 (Invalid Handle)
- Encoding issues (UTF-8)
- Console color issues
- Flask/Click console echoing
"""
import sys
import os
import logging

def fix_windows_streams():
    """
    Robust fix for Windows invalid handle error (Error 6)
    This often happens when running as a background service or subprocess
    where standard streams might be invalid or closed.
    """
    if os.name != 'nt':
        return

    def _fix_stream(stream, mode):
        # Redirect stdin to devnull to prevent read errors in service mode
        if mode == 'r':
            try:
                return open(os.devnull, mode)
            except:
                return sys.stdin
            
        try:
            if stream is None or hasattr(stream, 'closed') and stream.closed:
                return open(os.devnull, mode)
            
            # Force validation by trying to interact with the stream
            try:
                stream.fileno()
            except (OSError, ValueError):
                # fileno failed, it's definitely invalid
                return open(os.devnull, mode)
            
            # Try a test write for output streams to ensure the handle is actually writable
            if 'w' in mode:
                try:
                    stream.write('')
                    if hasattr(stream, 'flush'):
                        stream.flush()
                except (OSError, ValueError, IOError):
                    # Write failed, redirect to devnull
                    return open(os.devnull, mode)
                    
            return stream
        except Exception:
            # Catch-all for any other weird errors
            try:
                return open(os.devnull, mode)
            except:
                return stream

    # Apply fixes to all standard streams including global backups
    sys.stdout = _fix_stream(sys.stdout, 'w')
    sys.stderr = _fix_stream(sys.stderr, 'w')
    sys.stdin = _fix_stream(sys.stdin, 'r')
    
    sys.__stdout__ = sys.stdout
    sys.__stderr__ = sys.stderr
    sys.__stdin__ = sys.stdin

    os.environ['PYTHONIOENCODING'] = 'utf-8'
    os.environ['ANSI_COLORS_DISABLED'] = '1' # Prevent colorama issues

def disable_click_echo():
    """Disable Click's console echoing which often causes Error 6 on Windows"""
    try:
        import click
        def _silent_echo(*args, **kwargs): pass
        click.echo = _silent_echo
        click.secho = _silent_echo
    except (ImportError, Exception):
        pass

def silence_werkzeug():
    """Reduce Werkzeug logging to prevent console noise/handle issues"""
    try:
        import logging
        logging.getLogger('werkzeug').setLevel(logging.ERROR)
    except Exception:
        pass
