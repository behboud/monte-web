<?php
/**
 * Template for displaying search forms
 */
?>

<form role="search" method="get" class="search-form" action="<?php echo esc_url(home_url('/')); ?>">
    <div class="flex items-center gap-2">
        <label for="search-input" class="sr-only">
            <?php _e('Suche nach:', 'monte-theme'); ?>
        </label>
        <input 
            type="search" 
            id="search-input"
            class="form-input flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-monte focus:border-transparent" 
            placeholder="<?php echo esc_attr_x('Suchen...', 'placeholder', 'monte-theme'); ?>" 
            value="<?php echo get_search_query(); ?>" 
            name="s" 
        />
        <button 
            type="submit" 
            class="uk-btn uk-btn-default px-6 py-2 bg-monte text-white rounded-md hover:bg-opacity-90 transition-colors"
        >
            <?php _e('Suchen', 'monte-theme'); ?>
        </button>
    </div>
</form>
