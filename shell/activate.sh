# -*- mode: shell-script -*-
#
# Shell functions to act as wrapper for Ian Bicking's virtualenv
# (http://pypi.python.org/pypi/virtualenv)
#
#
# Copyright Doug Hellmann, All Rights Reserved
#
# Permission to use, copy, modify, and distribute this software and its
# documentation for any purpose and without fee is hereby granted,
# provided that the above copyright notice appear in all copies and that
# both that copyright notice and this permission notice appear in
# supporting documentation, and that the name of Doug Hellmann not be used
# in advertising or publicity pertaining to distribution of the software
# without specific, written prior permission.
#
# DOUG HELLMANN DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE,
# INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS, IN NO
# EVENT SHALL DOUG HELLMANN BE LIABLE FOR ANY SPECIAL, INDIRECT OR
# CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF
# USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
# OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
# PERFORMANCE OF THIS SOFTWARE.
#
#
# Project home page: http://www.doughellmann.com/projects/virtualenvwrapper/
#

# Verify that the NECO_ROOT directory exists
neco_verify_root () {
    if [ ! -d "$NECO_ROOT" ]; then
        [ "$1" != "-q" ] && echo "ERR: Ecosystem directory '$NECO_ROOT' does not exist.  Create it or set NECO_ROOT to an existing directory." 1>&2
        return 1
    fi
    return 0
}

# Verify that the requested environment exists
neco_verify_ecosystem () {
    typeset eco_name="$1"
    if [ ! -d "$NECO_ROOT/.neco/$eco_name" ]; then
       echo "ERR: Ecosystem '$eco_name' does not exist. Create it with 'neco create $env_name'." >&2
       return 1
    fi
    return 0
}

# Verify that the active environment exists
neco_verify_active_ecosystem () {
    if [ ! -n "${NODE_ECOSYSTEM}" ] || [ ! -n "${NODE_VERSION}" ]
    then
        echo "ERR: no ecosystem active, or active ecosystem is missing" >&2
        return 1
    fi
    return 0
}

neco_activate () {
	typeset eco_name="$1"
	if [ "$eco_name" = "" ]
    then
        return 1
    fi

    neco_verify_root || return 1
    neco_verify_ecosystem $eco_name || return 1
    
    activate="$NECO_ROOT/.neco/$eco_name/activate"
    if [ ! -f "$activate" ]
    then
        echo "ERR: Ecosystem '$NECO_ROOT/.neco/$eco_name' does not contain an activate script." >&2
        return 1
    fi
    
    # Deactivate any current environment "destructively"
    # before switching so we use our override function,
    # if it exists.
    type neco_deactivate >/dev/null 2>&1
    if [ $? -eq 0 ]
    then
        neco_deactivate
        unset -f neco_deactivate >/dev/null 2>&1
    fi

    source "$activate"
    
    # Save the deactivate function from virtualenv under a different name
    old_neco_deactivate=`typeset -f neco_deactivate | sed 's/neco_deactivate/old_neco_deactivate/g'`
    eval "$old_neco_deactivate"
    unset -f neco_deactivate >/dev/null 2>&1

    # Replace the deactivate() function with a wrapper.
    eval 'neco_deactivate () {

        # Call the local hook before the global so we can undo
        # any settings made by the local postactivate first.
        
        old_ecosytem=$(basename "$NODE_ECOSYSTEM")
        
        # Call the original function.
        old_neco_deactivate $1


        if [ ! "$1" = "nondestructive" ]
        then
            # Remove this function
            unset -f old_neco_deactivate >/dev/null 2>&1
            unset -f neco_deactivate >/dev/null 2>&1
        fi

    }'
    
    #virtualenvwrapper_run_hook "post_activate"
    
	return 0
}


#
# Set up tab completion.  (Adapted from Arthur Koziel's version at 
# http://arthurkoziel.com/2008/10/11/virtualenvwrapper-bash-completion/)
# 

#if [ -n "$BASH" ] ; then
#    _virtualenvs ()
#    {
#        local cur="${COMP_WORDS[COMP_CWORD]}"
#        COMPREPLY=( $(compgen -W "`virtualenvwrapper_show_workon_options`" -- ${cur}) )
#    }
#
#    _cdvirtualenv_complete ()
#    {
#        local cur="$2"
#        # COMPREPLY=( $(compgen -d -- "${VIRTUAL_ENV}/${cur}" | sed -e "s@${VIRTUAL_ENV}/@@" ) )
#        COMPREPLY=( $(cdvirtualenv && compgen -d -- "${cur}" ) )
#    }
#    _cdsitepackages_complete ()
#    {
#        local cur="$2"
#        COMPREPLY=( $(cdsitepackages && compgen -d -- "${cur}" ) )
#    }
#    complete -o nospace -F _cdvirtualenv_complete -S/ cdvirtualenv
#    complete -o nospace -F _cdsitepackages_complete -S/ cdsitepackages
#    complete -o default -o nospace -F _virtualenvs workon
#    complete -o default -o nospace -F _virtualenvs rmvirtualenv
#    complete -o default -o nospace -F _virtualenvs cpvirtualenv
#elif [ -n "$ZSH_VERSION" ] ; then
#    compctl -g "`virtualenvwrapper_show_workon_options`" workon rmvirtualenv cpvirtualenv
#fi
